import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days persistent session
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid email profile https://mail.google.com/ https://www.googleapis.com/auth/gmail.send",
          access_type: "offline",
          prompt: "consent",
        },
      },
      profile(profile) {
        return {
          id: String(profile.sub),
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          handle: profile.email ? profile.email.split("@")[0] : `user_${profile.sub.slice(-4)}`,
        };
      },
    }),
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
        const validOtp = await prisma.otpToken.findFirst({
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
        await prisma.otpToken.deleteMany({ where: { email } });

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
      if (new URL(url).origin === baseUrl) return url;
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

        if (token.id && account.provider === "google") {
          try {
            await prisma.user.update({
              where: { id: token.id as string },
              data: {
                gmailAccessToken: account.access_token,
                gmailRefreshToken: account.refresh_token || undefined,
                gmailConnectedAt: new Date(),
                gmailEmail: user?.email || (token.email as string) || undefined,
              },
            });
          } catch (e) {
            console.error("Failed to auto-save gmailAccessToken to user:", e);
          }
        }
      }

      // Fetch user's current role and gmail state from database
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, roleSelected: true, gmailAccessToken: true, gmailEmail: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.roleSelected = dbUser.roleSelected;
          token.gmailConnected = !!dbUser.gmailAccessToken;
          token.gmailEmail = dbUser.gmailEmail || null;
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
        (session.user as any).gmailConnected = !!token.gmailConnected;
        (session.user as any).gmailEmail = (token.gmailEmail as string) ?? null;
      }
      return session;
    },
    async signIn() {
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        await prisma.profile.create({
          data: {
            userId: user.id,
            isPublic: true,
          },
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
