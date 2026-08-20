/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function JobApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const applicationId = resolvedParams.id;
  const { data: session, status } = useSession();

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
  const [optimizeResume, setOptimizeResume] = useState(true);
  const [customInstructions, setCustomInstructions] = useState("");
  const [regeneratingResume, setRegeneratingResume] = useState(false);
  const [regeneratingCover, setRegeneratingCover] = useState(false);

  // Q&A State
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaPairs, setQaPairs] = useState<any[]>([]);

  // PDF Preview Modal State
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>("");

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
      setOptimizeResume(a.optimizeResume !== false);
      setCustomInstructions(a.customInstructions || "");
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
          customInstructions: customInstructions.trim() || null,
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
    try {
      setRegeneratingCover(true);
      await handleSave({ regenerateCoverLetter: true });
      setSuccessMsg("Cover letter regenerated with your custom instructions!");
    } finally {
      setRegeneratingCover(false);
    }
  };

  const handleRegenerateResume = async () => {
    try {
      setRegeneratingResume(true);
      await handleSave({ regenerateResume: true, optimizeResume: true });
      setSuccessMsg("Tailored Resume regenerated in Resume Studio architecture with your active repositories!");
    } finally {
      setRegeneratingResume(false);
    }
  };

  const handleReviewCoverLetterPdf = async () => {
    await handleSave();
    setPdfPreviewTitle("Cover Letter PDF Review");
    setPdfPreviewUrl(`/api/jobs/${applicationId}/pdf/cover-letter?t=${Date.now()}`);
  };

  const handleDownloadCoverLetterPdf = async () => {
    await handleSave();
    const url = `/api/jobs/${applicationId}/pdf/cover-letter?t=${Date.now()}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "Cover-Letter.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  const handleOpenEmailClient = async (type: "gmail" | "mailto") => {
    if (!recipientEmail.trim()) {
      setError("Please provide a valid recipient email before opening email client.");
      return;
    }

    try {
      // 1. Auto-download Cover Letter PDF
      handleDownloadCoverLetterPdf();

      // 2. Auto-download Resume PDF after short delay
      setTimeout(() => {
        const url = `/api/jobs/${applicationId}/pdf/resume?t=${Date.now()}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = "Resume.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, 600);

      // 3. Copy Email Body text to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(emailBody);
      }

      // 4. Construct URL and launch email client
      const encTo = encodeURIComponent(recipientEmail.trim());
      const encSub = encodeURIComponent(emailSubject.trim());
      const encBody = encodeURIComponent(emailBody.trim());

      if (type === "gmail") {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encTo}&su=${encSub}&body=${encBody}`;
        window.open(gmailUrl, "_blank");
      } else {
        const mailtoUrl = `mailto:${encTo}?subject=${encSub}&body=${encBody}`;
        window.location.href = mailtoUrl;
      }

      setSuccessMsg(
        `Opened draft in ${type === "gmail" ? "Gmail Web" : "Mail App"} for ${recipientEmail}! PDFs downloaded & text copied to clipboard.`
      );
    } catch (err: any) {
      setError(err.message || "Failed to open email client");
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
      if (res.ok) {
        setSuccessMsg(
          data.simulated
            ? `Application prepared for ${recipientEmail}! (Simulated Mode - Set GMAIL_USER & GMAIL_APP_PASSWORD in .env to deliver real email)`
            : `Application email successfully sent to ${recipientEmail}!`
        );
        loadApplication();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="py-20 text-center">
        <span className="text-xs font-bold text-neutral-400 animate-pulse">
          Loading Job Application Studio...
        </span>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-12 border border-neutral-800 rounded-2xl bg-neutral-900/30 text-center space-y-4">
        <h3 className="text-lg font-bold text-white">Job Application Not Found</h3>
        <p className="text-xs text-neutral-400">
          The requested application may have been deleted or does not exist.
        </p>
        <Link
          href="/dashboard/jobs"
          className="inline-block bg-emerald-400 text-black font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-300 transition-colors"
        >
          Return to Applications List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <Link href="/dashboard/jobs" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
            Back to All Applications
          </Link>
          <span className="font-mono text-neutral-500">App ID: {app.id}</span>
        </div>

        {/* Feedback Notifications */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs text-neutral-400 hover:text-white">
              Dismiss
            </button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-center justify-between">
            <span>{successMsg}</span>
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
                Recipient Email (Apply Address)
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
                    <span>Send Application Email Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ATS Match Score & Skill Analysis */}
        <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>ATS Match Analysis</span>
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

        {/* Custom User Instructions / Guidance Card */}
        <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400">⚡</span>
              <span>Custom Tailoring Instructions & Focus (Optional)</span>
            </h2>
            <span className="text-xs text-neutral-500 font-mono">
              Auto-integrated with Active Repositories
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            Provide specific directions to guide the AI when tailoring your Resume and Cover Letter (e.g. emphasize specific tech stacks, freelance projects, or leadership accomplishments).
          </p>

          <textarea
            rows={3}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g. Focus heavily on Next.js 14, PostgreSQL and AI agent workflows; Emphasize my client delivery track record; Frame my skills for a Senior Full Stack Engineer role..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-neutral-500">
              💡 Changes will be applied whenever you regenerate the resume or cover letter.
            </span>

            <div className="flex gap-2">
              <button
                onClick={handleRegenerateCoverLetter}
                disabled={regeneratingCover || saving}
                className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-xs font-bold px-3.5 py-2 rounded-xl text-neutral-200 transition-colors flex items-center gap-1.5"
              >
                {regeneratingCover ? "Regenerating Cover..." : "Regenerate Cover Letter"}
              </button>

              <button
                onClick={handleRegenerateResume}
                disabled={regeneratingResume || saving}
                className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                {regeneratingResume ? "Tailoring Resume..." : "Regenerate Tailored Resume"}
              </button>
            </div>
          </div>
        </section>

        {/* Tailored Resume Studio Card */}
        <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Tailored Resume (Resume Studio Architecture)</span>
                <span className="text-xs font-mono font-bold bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 px-2 py-0.5 rounded-md">
                  Active Repos Enhanced
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Tailored dynamically using your active GitHub repositories, real projects, and job description requirements.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setPdfPreviewTitle("Tailored Resume PDF Preview");
                  setPdfPreviewUrl(`/api/jobs/${applicationId}/pdf/resume?t=${Date.now()}`);
                }}
                className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>Review Resume PDF</span>
              </button>

              <a
                href={`/api/jobs/${applicationId}/pdf/resume?t=${Date.now()}`}
                download="Tailored-Resume.pdf"
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>Download PDF</span>
              </a>

              <button
                onClick={handleRegenerateResume}
                disabled={regeneratingResume || saving}
                className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-md"
              >
                {regeneratingResume ? "Tailoring..." : "Re-tailor Resume"}
              </button>
            </div>
          </div>

          {/* Resume Studio Preview Content */}
          {app.resumeVersion?.content ? (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4 text-xs">
              {app.resumeVersion.polishSummary && (
                <div className="bg-neutral-900 border border-emerald-500/20 rounded-lg p-3 text-neutral-300 space-y-1">
                  <span className="font-bold text-emerald-400 block text-[11px] uppercase tracking-wider">
                    AI Tailoring & Optimization Notes:
                  </span>
                  <p className="leading-relaxed">{app.resumeVersion.polishSummary}</p>
                  {app.resumeVersion.polishNotes && (
                    <p className="text-neutral-400 text-[11px] pt-1 whitespace-pre-line">{app.resumeVersion.polishNotes}</p>
                  )}
                </div>
              )}

              <div className="space-y-1 border-b border-neutral-800 pb-3">
                <h3 className="text-base font-extrabold text-white">
                  {app.resumeVersion.content.name || "Candidate"}
                </h3>
                <p className="text-emerald-400 font-semibold">
                  {app.resumeVersion.content.headline}
                </p>
                {app.resumeVersion.content.summary && (
                  <p className="text-neutral-300 leading-relaxed pt-1">
                    {app.resumeVersion.content.summary}
                  </p>
                )}
              </div>

              {/* Skills */}
              {app.resumeVersion.content.skills && app.resumeVersion.content.skills.length > 0 && (
                <div className="space-y-2 border-b border-neutral-800 pb-3">
                  <span className="font-bold text-neutral-400 uppercase tracking-wider text-[11px]">
                    Technical Skills Categorized:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {app.resumeVersion.content.skills.map((cat: any, cIdx: number) => (
                      <div key={cIdx} className="bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
                        <span className="font-bold text-neutral-200 block text-[11px]">{cat.category || "Skills"}:</span>
                        <span className="text-neutral-400 text-[11px]">
                          {Array.isArray(cat.items) ? cat.items.join(" • ") : cat.items || cat.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Showcased Projects & Active Repositories */}
              {app.resumeVersion.content.projects && app.resumeVersion.content.projects.length > 0 && (
                <div className="space-y-2 border-b border-neutral-800 pb-3">
                  <span className="font-bold text-neutral-400 uppercase tracking-wider text-[11px]">
                    Showcased Active Projects & Repositories:
                  </span>
                  <div className="grid gap-2">
                    {app.resumeVersion.content.projects.map((proj: any, pIdx: number) => (
                      <div key={pIdx} className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{proj.name}</span>
                          {proj.repoUrl && (
                            <a
                              href={proj.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-400 hover:underline font-mono"
                            >
                              GitHub ↗
                            </a>
                          )}
                        </div>
                        {proj.techStack && (
                          <span className="text-[11px] text-emerald-300 font-mono block">Tech: {proj.techStack}</span>
                        )}
                        {proj.bullets && Array.isArray(proj.bullets) && (
                          <ul className="list-disc list-inside text-neutral-300 text-[11px] space-y-0.5 pt-0.5">
                            {proj.bullets.map((b: string, bIdx: number) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 text-center space-y-2 text-xs">
              <p className="text-neutral-400">No tailored resume version generated yet.</p>
              <button
                onClick={handleRegenerateResume}
                disabled={regeneratingResume}
                className="bg-emerald-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl hover:bg-emerald-300"
              >
                Generate Tailored Resume Studio Version Now
              </button>
            </div>
          )}
        </section>

        {/* Humanly Written Cover Letter Section */}
        <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">ATS Humanly Written Cover Letter</h2>
              <p className="text-xs text-neutral-400">
                Tailored for {company || "the company"} using your resume, active repositories, and custom instructions.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleReviewCoverLetterPdf}
                disabled={saving}
                className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Review Cover Letter PDF</span>
              </button>

              <button
                onClick={handleDownloadCoverLetterPdf}
                disabled={saving}
                className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Download PDF</span>
              </button>

              <button
                onClick={handleRegenerateCoverLetter}
                disabled={regeneratingCover || saving}
                className="bg-neutral-800 hover:bg-neutral-700 text-xs font-bold px-3.5 py-2 rounded-lg text-neutral-200 transition-colors flex items-center gap-1.5"
              >
                <span>{regeneratingCover ? "Regenerating..." : "Regenerate with AI"}</span>
              </button>

              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-extrabold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                {saving ? "Saving..." : "Save Cover Letter"}
              </button>
            </div>
          </div>

          <textarea
            rows={12}
            value={coverLetterContent}
            onChange={(e) => setCoverLetterContent(e.target.value)}
            placeholder="Edit your cover letter manually..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 leading-relaxed focus:outline-none focus:border-emerald-500 font-sans"
          />
        </section>

        {/* AI Screening Q&A Engine */}
        <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">AI Screening Q&A Engine</h2>
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
          <h2 className="text-lg font-bold text-white">Application Email Preview</h2>

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

            <div className="flex items-center justify-between pt-2 flex-wrap gap-4">
              <div className="text-xs text-neutral-400 flex items-center gap-2 flex-wrap">
                <span>PDF Attachments:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPdfPreviewTitle("Resume PDF Review");
                    setPdfPreviewUrl(`/api/jobs/${applicationId}/pdf/resume`);
                  }}
                  className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 text-emerald-400 font-mono px-2.5 py-1 rounded transition-colors flex items-center gap-1"
                >
                  <span>Resume.pdf</span>
                </button>
                <span>+</span>
                <button
                  type="button"
                  onClick={() => {
                    setPdfPreviewTitle("Cover Letter PDF Review");
                    setPdfPreviewUrl(`/api/jobs/${applicationId}/pdf/cover-letter`);
                  }}
                  className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 text-emerald-400 font-mono px-2.5 py-1 rounded transition-colors flex items-center gap-1"
                >
                  <span>Cover-Letter.pdf</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleOpenEmailClient("gmail")}
                  disabled={!recipientEmail.trim()}
                  className="bg-white hover:bg-neutral-100 disabled:opacity-50 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Open Gmail Web Draft ↗</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEmailClient("mailto")}
                  disabled={!recipientEmail.trim()}
                  className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Open Desktop Mail App ✉</span>
                </button>

                <button
                  onClick={handleSendEmail}
                  disabled={sending || !recipientEmail.trim()}
                  className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  <span>{sending ? "Sending..." : "Send Direct via Server"}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* PDF Review / Preview Modal */}
        {pdfPreviewUrl && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{pdfPreviewTitle}</span>
                </h3>
                <div className="flex items-center gap-3">
                  <a
                    href={pdfPreviewUrl}
                    download={pdfPreviewTitle.includes("Cover Letter") ? "Cover-Letter.pdf" : "Resume.pdf"}
                    className="text-xs bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>Download PDF</span>
                  </a>
                  <a
                    href={pdfPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Open in New Tab ↗
                  </a>
                  <button
                    onClick={() => setPdfPreviewUrl(null)}
                    className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors font-bold"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-neutral-900/40">
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full border-none"
                  title="PDF Preview"
                />
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
