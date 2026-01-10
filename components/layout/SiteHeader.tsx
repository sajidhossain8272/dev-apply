"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function SiteHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-6 w-6 border-2 border-[var(--fg)] bg-[var(--bg)] transition-transform group-hover:rotate-45" />
          <span className="text-sm font-black uppercase tracking-[0.3em] text-[var(--fg)]">
            dev-apply
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {session?.user && (
            <Link href="/dashboard">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--fg)] transition-colors">
                Dashboard
              </span>
            </Link>
          )}

          {status === "loading" && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Loading</span>
          )}

          {status === "unauthenticated" && (
            <Button
              type="button"
              variant="outline"
              className="h-8 px-4 text-[10px]"
              onClick={() => signIn("github")}
            >
              Sign In
            </Button>
          )}

          {status === "authenticated" && (
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-4 text-[10px] text-neutral-500 hover:text-white"
              onClick={() => signOut()}
            >
              Log Out
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
