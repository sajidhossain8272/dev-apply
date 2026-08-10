/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function JobApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const applicationId = resolvedParams.id;
  const { status } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [askingQa, setAskingQa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Application Data State
  const [app, setApp] = useState<any>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [coverLetterContent, setCoverLetterContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [optimizeResume, setOptimizeResume] = useState(false);

  // Q&A State
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaPairs, setQaPairs] = useState<any[]>([]);

  const loadApplication = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/jobs/${applicationId}`);
      if (!res.ok) throw new Error("Failed to load application details");

      const data = await res.json();
      const a = data.application;

      setApp(a);
      setJobTitle(a.jobTitle || "");
      setCompany(a.company || "");
      setLocation(a.location || "");
      setRecipientEmail(a.recipientEmail || "");
      setCoverLetterContent(a.coverLetter?.content || "");
      setEmailSubject(a.emailSubject || "");
      setEmailBody(a.emailBody || "");
      setOptimizeResume(!!a.optimizeResume);
      setQaPairs(a.qaPairs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load application");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (status === "authenticated") {
      loadApplication();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, loadApplication]);

  const handleSave = async (extraFields: Record<string, any> = {}) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/jobs/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          company,
          location,
          recipientEmail,
          emailSubject,
          emailBody,
          coverLetterContent,
          optimizeResume,
          ...extraFields,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save application");
      }

      const data = await res.json();
      setApp(data.application);
      if (data.application.coverLetter?.content) {
        setCoverLetterContent(data.application.coverLetter.content);
      }
      setSuccessMsg("Changes saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save application");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCoverLetter = async () => {
    await handleSave({ regenerateCoverLetter: true });
  };

  const handleAskQa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim()) return;

    try {
      setAskingQa(true);
      setError(null);

      const res = await fetch(`/api/jobs/${applicationId}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: qaQuestion }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate AI answer");
      }

      const data = await res.json();
      setQaPairs(data.qaPairs || []);
      setQaQuestion("");
    } catch (err: any) {
      setError(err.message || "Error generating AI answer");
    } finally {
      setAskingQa(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail.trim()) {
      setError("Please provide a valid recipient email before sending.");
      return;
    }

    if (!confirm(`Are you sure you want to send this application email directly to ${recipientEmail}?`)) {
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccessMsg(null);

      // Save latest updates first
      await handleSave();

      const res = await fetch(`/api/jobs/${applicationId}/send`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send email");
      }

      const data = await res.json();
      setApp(data.application);
      setSuccessMsg(
        data.simulated
          ? "Application process completed! (SMTP not configured, email send simulated in logs)."
          : `🚀 Application email successfully sent to ${recipientEmail}!`
      );
    } catch (err: any) {
      setError(err.message || "Error sending email application");
    } finally {
      setSending(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-neutral-400 mb-4">Job Application not found.</p>
        <Link href="/dashboard/jobs" className="text-emerald-400 font-bold hover:underline">
          ← Back to Job Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500 selection:text-black">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <Link href="/dashboard/jobs" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
            ← Back to All Applications
          </Link>
          <span className="font-mono text-neutral-500">App ID: {app.id}</span>
        </div>

        {/* Feedback Notifications */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-xs text-neutral-400 hover:text-white">
              Dismiss
            </button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-center justify-between">
            <span>✅ {successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="text-xs text-neutral-400 hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <section className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Job Title"
                  className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xl font-extrabold text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company"
                  className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">Location:</span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Recipient Email & Direct Send Action */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3 min-w-[280px]">
              <label className="block text-xs font-bold text-neutral-300">
                📩 Recipient Email (Apply Address)
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="e.g. career@penough.com"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />

              <button
                onClick={handleSendEmail}
                disabled={sending || !recipientEmail.trim()}
                className="w-full bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-bold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
              >
                {sending ? (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-black"></span>
                    <span>Sending Application...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Send Application Email Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ATS Match Score & Skill Analysis */}
        <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🎯 ATS Match Analysis</span>
            <span
              className={`ml-auto text-sm font-mono font-bold px-3 py-1 rounded-full ${
                app.matchScore >= 80
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              Score: {app.matchScore ?? "N/A"}%
            </span>
          </h2>

          {app.matchReasons && Array.isArray(app.matchReasons) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {app.matchReasons.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    item.matched
                      ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                      : "bg-red-950/20 border-red-900/40 text-red-300"
                  }`}
                >
                  <span className="text-base leading-none">{item.matched ? "✓" : "✗"}</span>
                  <div className="space-y-0.5">
                    <span className="font-semibold block">{item.reason}</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-mono">{item.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cover Letter Studio */}
        <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">✍️ ATS Humanly Written Cover Letter</h2>
              <p className="text-xs text-neutral-400">
                Tailored for {company || "the company"} using your resume and key qualifications.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerateCoverLetter}
                disabled={saving}
                className="bg-neutral-800 hover:bg-neutral-700 text-xs font-bold px-3.5 py-2 rounded-lg text-neutral-200 transition-colors flex items-center gap-1.5"
              >
                <span>🔄 Regenerate with AI</span>
              </button>

              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                {saving ? "Saving..." : "Save Cover Letter"}
              </button>
            </div>
          </div>

          <textarea
            rows={12}
            value={coverLetterContent}
            onChange={(e) => setCoverLetterContent(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 leading-relaxed focus:outline-none focus:border-emerald-500 font-sans"
          />
        </section>

        {/* Resume Option & Optimization Toggle */}
        <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">📄 Resume Attachment Selection</h2>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={optimizeResume}
                onChange={(e) => {
                  setOptimizeResume(e.target.checked);
                  handleSave({ optimizeResume: e.target.checked });
                }}
                className="w-4 h-4 rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 bg-neutral-900"
              />
              <span className="text-xs text-neutral-300">
                Optimize Resume Keywords for this Job
              </span>
            </label>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-neutral-300">
              <span className="font-bold">Attached Resume File:</span>
              <span className="font-mono text-emerald-400">
                {optimizeResume ? "Tailored-Optimized-Resume.pdf" : "Sajid-Hossain-Resume.pdf"}
              </span>
            </div>
            {app.resumeVersion && optimizeResume && (
              <div className="text-neutral-400 border-t border-neutral-800 pt-2 space-y-1">
                <p className="font-semibold text-neutral-300">AI Optimization Summary:</p>
                <p>{app.resumeVersion.polishSummary}</p>
              </div>
            )}
          </div>
        </section>

        {/* AI Screening Q&A Engine */}
        <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">🤖 AI Screening Q&A Engine</h2>
            <p className="text-xs text-neutral-400">
              Ask any application question (e.g. "Describe your experience with Django & React", "Why Penough Ltd.?"). AI generates a personalized reply tailored to your profile + this JD.
            </p>
          </div>

          <form onSubmit={handleAskQa} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={qaQuestion}
              onChange={(e) => setQaQuestion(e.target.value)}
              placeholder="e.g., Why are you a good fit for Senior Full Stack Developer at Penough Ltd.?"
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={askingQa || !qaQuestion.trim()}
              className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-bold text-xs px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap flex items-center justify-center gap-2"
            >
              {askingQa ? (
                <>
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-black"></span>
                  <span>Generating...</span>
                </>
              ) : (
                <span>Ask AI Answer</span>
              )}
            </button>
          </form>

          {/* Q&A List */}
          {qaPairs.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Saved Application Q&As ({qaPairs.length})
              </h3>
              <div className="space-y-3">
                {qaPairs.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">Q: {item.question}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(item.answer)}
                        className="text-[10px] text-neutral-400 hover:text-white bg-neutral-900 px-2 py-1 rounded"
                      >
                        Copy Answer
                      </button>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed font-sans">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Application Email Preview & Direct Send */}
        <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">✉️ Application Email Preview</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">Subject Line</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">Email Body</label>
              <textarea
                rows={6}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 leading-relaxed focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-neutral-400 flex items-center gap-2">
                <span>📎 Attachments:</span>
                <span className="text-emerald-400 font-mono">
                  {optimizeResume ? "Tailored-Resume.pdf" : "Sajid-Hossain-Resume.pdf"} + Cover-Letter.txt
                </span>
              </div>

              <button
                onClick={handleSendEmail}
                disabled={sending || !recipientEmail.trim()}
                className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
              >
                {sending ? "Sending..." : "🚀 Send Application Now"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
