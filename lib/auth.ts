import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days persistent session
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email || `${profile.login}@users.noreply.github.com`,
          image: profile.avatar_url,
          handle: profile.login,
          githubUsername: profile.login,
        };
      },
    }),
    CredentialsProvider({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) {
          throw new Error("Email and OTP code are required.");
        }

        const email = credentials.email.toLowerCase().trim();
        const code = credentials.code.trim();

        // 1. Verify OTP token in database
        const validOtp = await (prisma as any).otpToken.findFirst({
          where: {
            email,
            code,
            expiresAt: { gt: new Date() },
          },
        });

        if (!validOtp) {
          throw new Error("Invalid or expired OTP code.");
        }

        // Delete used OTP token
        await (prisma as any).otpToken.deleteMany({ where: { email } });

        // 2. Find or create user
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0],
              handle: `${email.split("@")[0]}_${Date.now().toString().slice(-4)}`,
              emailVerified: new Date(),
              profile: {
                create: {
                  headline: "Developer",
                  isPublic: true,
                },
              },
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          handle: user.handle,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.includes("error=")) return `${baseUrl}/login`;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch {
        // Ignore URL parse error
      }
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, account, user, profile }) {
      if (user) {
        token.id = user.id;
        token.handle = (user as any).handle || (profile as any)?.login || null;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;

        if (token.id && account.provider === "github") {
          try {
            await prisma.user.update({
              where: { id: token.id as string },
              data: {
                githubAccessToken: account.access_token,
                githubUsername: (profile as any)?.login || (user as any)?.handle || undefined,
              },
            });
          } catch (e) {
            console.error("Failed to auto-save githubAccessToken to user:", e);
          }
        }
      }

      // Fetch user's current role state from database
      if (token.id) {
        try {
          const dbUser = await (prisma.user.findUnique as any)({
            where: { id: token.id as string },
            select: { role: true, roleSelected: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.roleSelected = dbUser.roleSelected;
          }
        } catch (error) {
          // Do not turn an otherwise valid OAuth callback into OAuthCallback
          // when an optional role lookup is temporarily unavailable.
          console.error("Failed to load user role during session refresh:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.handle = (token.handle as string) ?? null;
        (session.user as any).role = token.role ?? null;
        (session.user as any).roleSelected = !!token.roleSelected;
      }
      return session;
    },
    async signIn({ user, profile }) {
      try {
        const email = user.email?.toLowerCase() || `${(profile as any)?.login || "github-user"}@users.noreply.github.com`;
        const handle = (profile as any)?.login || (user as any).handle || undefined;
        const dbUser = await prisma.user.upsert({
          where: { email },
          create: {
            email,
            name: user.name || handle || "Developer",
            image: user.image,
            handle,
            emailVerified: new Date(),
            profile: { create: { isPublic: true } },
          },
          update: {
            name: user.name || undefined,
            image: user.image || undefined,
            handle: handle || undefined,
            emailVerified: new Date(),
          },
        });
        user.id = dbUser.id;
      } catch (error) {
        console.error("Failed to persist OAuth user:", error);
        return false;
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        await prisma.profile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, isPublic: true },
          update: {},
        });
      } catch (e) {
        console.error("Error creating default profile for user:", e);
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-apply-super-secret-key-32-chars-min",
};
