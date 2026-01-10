"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function HomePage() {
  return (
    <section className="relative flex flex-col items-center justify-center py-20 text-center">
      {/* Background Micro-animation Element */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[10%] h-64 w-64 bg-white/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] h-64 w-64 bg-white/5 blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="max-w-4xl space-y-12">
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-neutral-500">
            Professional Identity • Open Source
          </p>
          <h1 className="text-5xl font-bold tracking-tighter sm:text-7xl xl:text-8xl">
            FROM CODE TO <span className="text-neutral-500">CAREER.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-neutral-400 sm:text-xl">
            Generate a state-of-the-art, ATS-compatible portfolio and resume directly
            from your GitHub data. Built for developers who let their work speak for itself.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="w-full sm:w-auto"
          >
            Connect GitHub
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              Enter Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-12 pt-20 text-left sm:grid-cols-3">
          <div className="group space-y-4">
            <div className="h-[1px] w-full bg-neutral-800 transition-colors group-hover:bg-neutral-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest">ATS Optimized</h3>
            <p className="text-sm leading-relaxed text-neutral-500 transition-colors group-hover:text-neutral-300">
              Clean structure and semantic HTML that passes through recruitment software without errors.
            </p>
          </div>
          <div className="group space-y-4">
            <div className="h-[1px] w-full bg-neutral-800 transition-colors group-hover:bg-neutral-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Pinned Projects</h3>
            <p className="text-sm leading-relaxed text-neutral-500 transition-colors group-hover:text-neutral-300">
              Automatically imports your pinned repositories as high-quality project showcases.
            </p>
          </div>
          <div className="group space-y-4">
            <div className="h-[1px] w-full bg-neutral-800 transition-colors group-hover:bg-neutral-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Stable Identity</h3>
            <p className="text-sm leading-relaxed text-neutral-500 transition-colors group-hover:text-neutral-300">
              Your own stable URL at <span className="font-mono opacity-80">/u/handle</span> to share with the world.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
