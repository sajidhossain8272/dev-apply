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
          const baseName = email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "");
          let handleCandidate = baseName || "user";
          const existingHandle = await prisma.user.findUnique({ where: { handle: handleCandidate } });
          if (existingHandle) {
            handleCandidate = `${baseName}_${Date.now().toString().slice(-4)}`;
          }

          user = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0],
              handle: handleCandidate,
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
      // 1. On initial sign-in (user or account present)
      if (account && profile && account.provider === "github") {
        try {
          const ghEmail = (user?.email || (profile as any)?.email || `${(profile as any)?.login}@users.noreply.github.com`).toLowerCase().trim();
          const ghHandle = (profile as any)?.login || "developer";
          const ghName = user?.name || (profile as any)?.name || ghHandle;
          const ghImage = user?.image || (profile as any)?.avatar_url;

          // Find or create Prisma user
          let dbUser = await prisma.user.findFirst({
            where: {
              OR: [
                { email: ghEmail },
                { githubUsername: ghHandle },
              ],
            },
          });

          if (!dbUser) {
            let handleCandidate = ghHandle;
            const handleExists = await prisma.user.findUnique({ where: { handle: handleCandidate } });
            if (handleExists) {
              handleCandidate = `${ghHandle}_${Date.now().toString().slice(-4)}`;
            }

            dbUser = await prisma.user.create({
              data: {
                email: ghEmail,
                name: ghName,
                image: ghImage,
                handle: handleCandidate,
                githubUsername: ghHandle,
                githubAccessToken: account.access_token,
                emailVerified: new Date(),
                profile: { create: { isPublic: true } },
              },
            });
          } else {
            // Update GitHub credentials and avatar
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                githubAccessToken: account.access_token || dbUser.githubAccessToken,
                githubUsername: ghHandle,
                image: ghImage || dbUser.image,
                name: dbUser.name || ghName,
                emailVerified: dbUser.emailVerified || new Date(),
              },
            });
          }

          token.id = dbUser.id;
          token.handle = dbUser.handle;
          token.role = (dbUser as any).role || null;
          token.roleSelected = !!(dbUser as any).roleSelected;
          token.accessToken = account.access_token;
        } catch (err) {
          console.error("Error linking GitHub user in jwt callback:", err);
          if (user?.id) token.id = user.id;
        }
      } else if (user) {
        token.id = user.id;
        token.handle = (user as any).handle || null;
      }

      // 2. Subsequent session token lookups
      if (token.id && !token.role) {
        try {
          const dbUser = await (prisma.user.findUnique as any)({
            where: { id: token.id as string },
            select: { id: true, handle: true, role: true, roleSelected: true },
          });
          if (dbUser) {
            token.handle = dbUser.handle || token.handle;
            token.role = dbUser.role;
            token.roleSelected = dbUser.roleSelected;
          }
        } catch (error) {
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
    async signIn({ user, profile, account }) {
      // Return true to allow OAuth process to complete, jwt callback handles persistence safely
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
