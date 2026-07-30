import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 Days (Keep logged in until explicit logout)
    updateAge: 24 * 60 * 60, // 24 Hours refresh interval
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    // Later: add LinkedIn, Facebook providers here
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.handle = (user as any).handle ?? null;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && account.access_token) {
        // Save the access token to the database for automated syncs
        await prisma.user.update({
          where: { id: user.id },
          data: {
            githubAccessToken: account.access_token,
          },
        });
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Create a default profile for new users
      await prisma.profile.create({
        data: {
          userId: user.id,
          isPublic: true,
        },
      });
    },
  },
  pages: {
    signIn: "/",
  },
  // For production, you must set NEXTAUTH_URL & NEXTAUTH_SECRET in env
};
