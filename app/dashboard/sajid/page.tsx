/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function SajidResumeCenter() {
  const { status } = useSession();
  const [jd, setJd] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [apps, setApps] = useState<any[]>([]);

  const load = async () => {
    try {
      const r = await fetch("/api/jobs");
      if (r.ok) {
        const data = await r.json();
        setApps(data.applications || []);
      }
    } catch (err: any) {
      console.error("Failed to load applications:", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/sajid/bootstrap", { method: "POST" })
        .then(load)
        .catch(console.error);
    }
  }, [status]);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jd.trim()) return;

    setBusy(true);
    setError("");

    try {
      const r = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jdText: jd,
          optimizeResume: true,
          customInstructions: customInstructions.trim() || undefined,
        }),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Generation failed");

      setJd("");
      setCustomInstructions("");
      await load();
      if (d.application?.id) {
        window.location.href = `/dashboard/jobs/${d.application.id}`;
      }
    } catch (x: any) {
      setError(x.message || "Failed to generate tailored resume");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="py-20 text-center text-neutral-400 font-mono text-xs animate-pulse">
        Loading personal workspace & active repositories...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-bold">
            Sajid Hossain / Personal Workspace
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
            JD to Tailored Resume Studio
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Data-enhanced platform utilizing your active GitHub repositories, freelance track record, and core Resume Studio architecture.
          </p>
        </div>

        <Link
          href="/dashboard/resume"
          className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-700 hover:border-emerald-500/50 text-neutral-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
        >
          <span>Open Base Resume Studio ↗</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-800 bg-red-950/40 text-red-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Generator Form */}
      <form onSubmit={generate} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-neutral-300 mb-2">
            Target Job Description (JD) <span className="text-emerald-400">*</span>
          </label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            required
            rows={8}
            placeholder="Paste the complete job description here..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowCustomPrompt(!showCustomPrompt)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
            >
              <span>{showCustomPrompt ? "▼ Hide Custom Focus Instructions" : "▶ Add Custom Instructions / Requirements (Optional)"}</span>
            </button>
            <span className="text-[11px] text-neutral-500">Auto-enhances with active GitHub projects</span>
          </div>

          {showCustomPrompt && (
            <textarea
              rows={3}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Highlight Next.js, TypeScript, and AI agent workflows; Emphasize performance optimization; Prioritize full-stack architecture..."
              className="w-full bg-neutral-950 border border-emerald-500/30 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 font-sans"
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Resume Studio Core Architecture + Active GitHub Repos Enabled</span>
          </div>

          <button
            type="submit"
            disabled={busy || !jd.trim()}
            className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2"
          >
            {busy ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-black"></span>
                <span>Tailoring & Generating...</span>
              </>
            ) : (
              <span>Generate Tailored Resume PDF</span>
            )}
          </button>
        </div>
      </form>

      {/* Saved Applications & Role Versions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Saved Role Versions & Applications</h2>
          <Link href="/dashboard/jobs" className="text-xs text-emerald-400 hover:underline font-semibold">
            View All in Applications Studio →
          </Link>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30 text-xs text-neutral-500">
            No tailored roles created yet. Paste a Job Description above to generate your first tailored resume.
          </div>
        ) : (
          <div className="grid gap-3">
            {apps.map((a) => (
              <div
                key={a.id}
                className="border border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">{a.jobTitle || "Untitled Role"}</h3>
                    {a.matchScore && (
                      <span className="text-[11px] font-mono font-bold bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 px-2 py-0.5 rounded-md">
                        {a.matchScore}% ATS Match
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {a.company || "Target Company"} · {new Date(a.createdAt).toLocaleDateString()} {a.recipientEmail ? `· Apply: ${a.recipientEmail}` : ""}
                  </p>
                  {a.customInstructions && (
                    <p className="text-[11px] text-neutral-500 italic mt-1 line-clamp-1">
                      Focus: &quot;{a.customInstructions}&quot;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={`/api/jobs/${a.id}/pdf/resume`}
                    className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50 px-3.5 py-2 rounded-lg transition-colors"
                  >
                    Resume PDF
                  </a>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={`/api/jobs/${a.id}/pdf/cover-letter`}
                    className="text-xs font-bold text-neutral-300 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 px-3.5 py-2 rounded-lg transition-colors"
                  >
                    Cover Letter
                  </a>
                  <Link
                    href={`/dashboard/jobs/${a.id}`}
                    className="text-xs font-bold text-neutral-400 hover:text-white px-2 py-2 transition-colors"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
