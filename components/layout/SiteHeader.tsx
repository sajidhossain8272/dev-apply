"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function SiteHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-sky-500" />
          <span className="text-sm font-semibold tracking-tight">
            dev-apply
          </span>
        </Link>

        <nav className="flex items-center gap-3 text-xs text-slate-300">
          {session?.user && (
            <>
              <span className="hidden sm:inline">
                {session.user.name ?? session.user.email}
              </span>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-xs">
                  Dashboard
                </Button>
              </Link>
            </>
          )}

          {status === "loading" && (
            <span className="text-xs text-slate-400">Checking session…</span>
          )}

          {status === "unauthenticated" && (
            <Button
              type="button"
              variant="outline"
              className="text-xs"
              onClick={() => signIn("github")}
            >
              Sign in with GitHub
            </Button>
          )}

          {status === "authenticated" && (
            <Button
              type="button"
              variant="outline"
              className="text-xs"
              onClick={() => signOut()}
            >
              Sign out
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
