import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-10">
      <div className="max-w-3xl space-y-6">
        <p className="text-xs uppercase tracking-[0.25em] text-sky-400">
          open source · for developers
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          One click from GitHub to{" "}
          <span className="text-sky-400">ATS resume</span> and{" "}
          <span className="text-sky-400">live portfolio</span>.
        </h1>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Sign in with GitHub, get an instant ATS-friendly resume and a clean
          one-page portfolio on our subdomain. Your experience stays up to
          date, and automation can help you apply to the right opportunities.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href="/api/auth/signin?provider=github">
            <Button>Sign in with GitHub</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">View dashboard</Button>
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          Freemium later, but the core will stay free and open source.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 sm:grid-cols-3 sm:p-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-200">
            ATS-friendly by default
          </p>
          <p className="text-xs text-slate-400">
            Simple typography and structure that parses cleanly in ATS systems
            and hiring tools.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-200">
            Live portfolio URL
          </p>
          <p className="text-xs text-slate-400">
            Each developer gets a unique SEO-friendly URL like
            <span className="font-mono"> /u/your-handle</span>.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-200">
            Automation-ready
          </p>
          <p className="text-xs text-slate-400">
            Hooks for n8n, cron jobs and AI to match jobs and send custom
            applications later.
          </p>
        </div>
      </div>
    </section>
  );
}
