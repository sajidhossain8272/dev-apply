import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days persistent session
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
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
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.includes("error=")) return `${baseUrl}/dashboard`;
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
        const userId = user?.id || (token.id as string);
        if (userId) {
          prisma.user
            .update({
              where: { id: userId },
              data: {
                githubAccessToken: account.access_token,
                ...(profile && (profile as any).login ? { githubUsername: (profile as any).login } : {}),
              },
            })
            .catch(() => {});
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.handle = (token.handle as string) ?? null;
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
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-apply-super-secret-key-32-chars-min",
};
