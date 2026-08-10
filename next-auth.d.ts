import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      handle?: string | null;
      gmailConnected?: boolean;
      gmailEmail?: string | null;
      role?: string | null;
      roleSelected?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    handle?: string | null;
  }
}
