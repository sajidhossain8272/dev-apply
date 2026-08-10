/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function JobApplicationsPage() {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New Application Form State
  const [jdText, setJdText] = useState("");
  const [optimizeResume, setOptimizeResume] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error("Failed to load job applications");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err: any) {
      setError(err.message || "Error loading applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      loadApplications();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, loadApplications]);

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText, optimizeResume }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process job description");
      }

      const data = await res.json();
      setJdText("");
      setOptimizeResume(false);
      // Reload applications list
      await loadApplications();
      // Redirect or highlight
      if (data.application?.id) {
        window.location.href = `/dashboard/jobs/${data.application.id}`;
      }
    } catch (err: any) {
      setError(err.message || "Error processing job description");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      (app.jobTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.recipientEmail || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-extrabold mb-4">Job Application Hub</h1>
        <p className="text-sm text-neutral-400 mb-8 max-w-md">
          Sign in to paste Job Descriptions, generate tailored cover letters, and send job applications directly.
        </p>
        <button
          onClick={() => signIn("github")}
          className="bg-emerald-400 text-black font-bold px-6 py-3 rounded-lg hover:bg-emerald-300 transition-colors"
        >
          Sign In with GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
        {/* Page Header */}
        <div className="border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>🚀 Job Applications Studio</span>
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Paste any job post (with recipient email like career@penough.com), auto-generate ATS cover letters & emails, and send directly.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full font-mono">
              Total Applications: {applications.length}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-xs text-neutral-400 hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        {/* Input JD Box */}
        <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <span>📥 Paste Job Description (JD)</span>
            </h2>
            <span className="text-xs text-neutral-400">
              Direct email apply supported (e.g. career@penough.com)
            </span>
          </div>

          <form onSubmit={handleCreateApplication} className="space-y-4">
            <textarea
              rows={6}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste raw JD post here, e.g.:

🚀 We’re Hiring — Senior Full Stack Developer
Penough Ltd. is looking for an experienced Senior Full Stack Developer...
📩 Apply: career@penough.com..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
              required
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={optimizeResume}
                  onChange={(e) => setOptimizeResume(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 bg-neutral-900"
                />
                <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">
                  Optimize Resume for this JD (AI Keyword & Skill Tailoring)
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting || !jdText.trim()}
                className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-bold px-6 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/10"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span>
                    <span>Analyzing & Preparing...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Process & Prepare Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Applications List & Filters */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">Tracked Applications</h2>

            <div className="flex items-center gap-3">
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company, title, email..."
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
              />

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="READY">Ready</option>
                <option value="SENT">Sent</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30 space-y-3">
              <p className="text-sm text-neutral-400">No job applications found matching filter.</p>
              <p className="text-xs text-neutral-500">Paste a Job Description above to create your first application!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-extrabold text-neutral-100 text-base">
                        {app.jobTitle || "Untitled Role"}
                      </h3>
                      <span className="text-xs bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded-full font-medium">
                        {app.company || "Company Unspecified"}
                      </span>
                      <StatusBadge status={app.status} />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-neutral-400 flex-wrap">
                      {app.recipientEmail ? (
                        <span className="text-emerald-400 font-mono flex items-center gap-1">
                          📩 {app.recipientEmail}
                        </span>
                      ) : (
                        <span className="text-neutral-500 font-mono">No direct email found</span>
                      )}
                      <span>📍 {app.location || "Remote/Unspecified"}</span>
                      <span>📅 Added: {new Date(app.createdAt).toLocaleDateString()}</span>
                      {app.sentAt && (
                        <span className="text-emerald-400">🚀 Sent: {new Date(app.sentAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Match Score */}
                    {app.matchScore !== null && (
                      <div className="text-right border-r border-neutral-800 pr-4 hidden sm:block">
                        <div className="text-xs text-neutral-400">Match Score</div>
                        <div
                          className={`text-lg font-black font-mono ${
                            app.matchScore >= 80
                              ? "text-emerald-400"
                              : app.matchScore >= 60
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}
                        >
                          {app.matchScore}%
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/dashboard/jobs/${app.id}`}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Open Apply Studio →
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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "SENT":
      return (
        <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          Sent
        </span>
      );
    case "READY":
      return (
        <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
          Ready
        </span>
      );
    case "DRAFT":
      return (
        <span className="text-[10px] uppercase font-bold tracking-wider bg-neutral-800 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded-full">
          Draft
        </span>
      );
    case "ARCHIVED":
      return (
        <span className="text-[10px] uppercase font-bold tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
          Archived
        </span>
      );
    default:
      return (
        <span className="text-[10px] uppercase font-bold tracking-wider bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full">
          {status}
        </span>
      );
  }
}
