"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      window.location.href = "/dashboard";
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <p className="text-xs text-neutral-400 font-mono">Redirecting to Dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-10">
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

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                className="w-full sm:w-auto bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold px-8 py-3 rounded-xl"
              >
                🚀 Connect GitHub (1-Click)
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto font-bold border-neutral-800 hover:border-emerald-500/50 px-8 py-3 rounded-xl"
                onClick={() => router.push("/login")}
              >
                ✉️ Sign In with Email & OTP
              </Button>
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
      </main>
    </>
  );
}
