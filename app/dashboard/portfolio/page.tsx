/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ExtractedContextPreview } from "@/components/dashboard/ExtractedContextPreview";
import { extractTextFromPdf } from "@/lib/pdf-extract";

interface QuestionItem {
  question: string;
  category?: string;
  hint?: string;
}

export default function PortfolioStudioPage() {
  const { status } = useSession();
  const [step, setStep] = useState<"ingest" | "questions" | "generating" | "preview">("ingest");

  // Ingestion State
  const [externalUrl, setExternalUrl] = useState("https://sajidev-p.vercel.app/");
  const [pdfTextContext, setPdfTextContext] = useState("");
  const [extractedContext, setExtractedContext] = useState<any | null>(null);
  const [extractingUrl, setExtractingUrl] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Questionnaire State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState<Record<number, boolean>>({});

  // Generation & Profile State
  const [generatingPortfolio, setGeneratingPortfolio] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [handle, setHandle] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCurrentProfile();
    }
  }, [status]);

  const fetchCurrentProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user.profile);
        setHandle(data.user.handle || "");
        if (data.user.profile?.externalPortfolioUrl) {
          setExternalUrl(data.user.profile.externalPortfolioUrl);
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setPdfError("Please upload a PDF file.");
      return;
    }

    try {
      setExtractingPdf(true);
      setPdfError(null);
      setPdfFileName(file.name);

      const text = await extractTextFromPdf(file);
      if (text.trim()) {
        setPdfTextContext(text);
        setMessage(`Extracted text from "${file.name}" — review and edit below, then click "Extract with AI".`);
      } else {
        setPdfError("No readable text found in this PDF. It may be a scanned image.");
      }
    } catch (err: any) {
      console.error("PDF extraction error:", err);
      setPdfError(err.message || "Failed to extract text from PDF.");
      setPdfFileName(null);
    } finally {
      setExtractingPdf(false);
      // Reset the input so the same file can be re-selected
      e.target.value = "";
    }
  };

  const handleExtractExternalData = async () => {
    try {
      setExtractingUrl(true);
      setError(null);
      setMessage(null);

      const res = await fetch("/api/portfolio/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: externalUrl.trim(),
          rawText: pdfTextContext.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to extract data from external URL.");
      }

      const data = await res.json();
      setExtractedContext(data.extracted || null);
      setMessage("AI successfully extracted portfolio data from your external link!");
    } catch (err: any) {
      setError(err.message || "Failed to extract data.");
    } finally {
      setExtractingUrl(false);
    }
  };

  const handleStartQuestionnaire = async () => {
    try {
      setLoadingQuestions(true);
      setError(null);

      const res = await fetch("/api/portfolio/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractedContext }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate questionnaire.");
      }

      const data = await res.json();
      setQuestions(data.questions || []);
      setStep("questions");
    } catch (err: any) {
      setError(err.message || "Failed to start AI questionnaire.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleWriteWithAi = async (idx: number) => {
    const q = questions[idx];
    if (!q) return;

    try {
      setLoadingSuggest((prev) => ({ ...prev, [idx]: true }));
      const res = await fetch("/api/resume/suggest-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question,
          category: q.category,
          hint: q.hint,
          userDraft: answers[idx] || "",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate suggestion.");
      }

      const data = await res.json();
      if (data.suggestion) {
        setAnswers((prev) => ({ ...prev, [idx]: data.suggestion }));
      }
    } catch (err: any) {
      console.error("AI suggestion error:", err);
      alert(err.message || "Failed to generate AI suggestion.");
    } finally {
      setLoadingSuggest((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const handleSynthesizePortfolio = async () => {
    try {
      setGeneratingPortfolio(true);
      setStep("generating");
      setError(null);

      const formattedAnswers = questions.map((q, idx) => ({
        question: q.question,
        category: q.category,
        answer: answers[idx] || "",
      }));

      const res = await fetch("/api/portfolio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: formattedAnswers,
          extractedContext,
          externalPortfolioUrl: externalUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to synthesize portfolio.");
      }

      const data = await res.json();
      setProfile(data.profile);
      setStep("preview");
    } catch (err: any) {
      setError(err.message || "Failed to generate portfolio.");
      setStep("questions");
    } finally {
      setGeneratingPortfolio(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicPortfolioUrl = handle ? `${appUrl}/u/${handle}` : `${appUrl}/u/demo`;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Portfolio Builder
              </span>
              <span className="text-xs text-neutral-400">Gemini 3.6 Flash / 3.1 Flash Lite Pipeline</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-neutral-100">
              Portfolio Builder
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Extract context from external portfolio links, PDF text, and GitHub repos to build your live developer portfolio page.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Back to Dashboard
            </Link>
            {handle && (
              <a
                href={publicPortfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-bold text-black bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20"
              >
                View Live Portfolio ↗
              </a>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-200 text-sm">
            {message}
          </div>
        )}

        {/* STEP 1: MULTI-SOURCE INGESTION */}
        {step === "ingest" && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-neutral-950 border border-neutral-800 p-8 rounded-2xl space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-xl font-bold text-white">Step 1: Multi-Source Portfolio Ingestion</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Import data from your existing live portfolio website, paste resume PDF text, or rely on GitHub context.
                </p>
              </div>

              {/* External Portfolio URL Input */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Option A: External Portfolio Link (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="e.g. https://sajidev-p.vercel.app/"
                    className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleExtractExternalData}
                    disabled={extractingUrl || !externalUrl.trim()}
                    className="px-4 py-2.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 rounded-lg hover:bg-emerald-900 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {extractingUrl ? (
                      <>
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-emerald-400 border-t-transparent rounded-full"></span>
                        Extracting Site...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Extract with AI
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Example: <code>https://sajidev-p.vercel.app/</code> — Gemini will fetch and parse projects, bio, services, and experience automatically!
                </p>
              </div>

              {/* PDF / Document Text Area */}
              <div className="space-y-3 pt-4 border-t border-neutral-900">
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Option B: PDF / Resume Text Context (Optional)
                </label>

                {/* PDF Upload Button */}
                <div className="flex items-center gap-3 flex-wrap">
                  <label
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 rounded-lg hover:bg-emerald-900 transition-all cursor-pointer ${
                      extractingPdf ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {extractingPdf ? (
                      <>
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-emerald-400 border-t-transparent rounded-full"></span>
                        Extracting PDF...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload PDF File
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={handlePdfUpload}
                      disabled={extractingPdf}
                    />
                  </label>
                  {pdfFileName && !extractingPdf && (
                    <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {pdfFileName}
                    </span>
                  )}
                </div>

                {pdfError && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {pdfError}
                  </p>
                )}

                <textarea
                  rows={4}
                  value={pdfTextContext}
                  onChange={(e) => setPdfTextContext(e.target.value)}
                  placeholder="Upload a PDF above to auto-extract text, or paste text from your resume/portfolio document here..."
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-[11px] text-neutral-500">
                  Upload a PDF resume or paste text manually — Gemini will parse skills, experience, projects, and services from it.
                </p>
              </div>

              {/* Extracted Context Preview */}
              {extractedContext && (
                <ExtractedContextPreview data={extractedContext} />
              )}

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  Ready to craft your portfolio questions?
                </span>
                <button
                  type="button"
                  onClick={handleStartQuestionnaire}
                  disabled={loadingQuestions}
                  className="px-6 py-2.5 text-xs font-bold text-black bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingQuestions ? (
                    <>
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full"></span>
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      Continue to AI Questionnaire →
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: INTERACTIVE QUESTIONNAIRE */}
        {step === "questions" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Interactive AI Portfolio Questionnaire</h2>
                <span className="text-xs text-emerald-400 font-bold">Step 2 of 3</span>
              </div>
              <p className="text-xs text-neutral-400">
                Answer these tailored questions or click &quot;Write with AI&quot; on any box to let Gemini compose compelling responses!
              </p>
            </div>

            {questions.map((q, idx) => (
              <div key={idx} className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 relative group">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Question {idx + 1} {q.category ? `• ${q.category}` : ""}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleWriteWithAi(idx)}
                    disabled={loadingSuggest[idx]}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 rounded-lg hover:bg-emerald-900 hover:border-emerald-400 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {loadingSuggest[idx] ? (
                      <>
                        <span className="animate-spin h-3 w-3 border-2 border-emerald-400 border-t-transparent rounded-full"></span>
                        Writing with AI...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {answers[idx]?.trim() ? "✨ Refine with AI" : "✨ Write with AI"}
                      </>
                    )}
                  </button>
                </div>

                <label className="block text-sm font-semibold text-neutral-200">
                  {q.question}
                </label>
                {q.hint && <p className="text-xs text-neutral-500 italic">Tip: {q.hint}</p>}

                <div className="relative">
                  <textarea
                    rows={3}
                    value={answers[idx] || ""}
                    onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                    placeholder="Type notes or click 'Write with AI' (leave empty to auto-generate based on GitHub & external site context)..."
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="text-[11px] text-neutral-500 flex items-center justify-between">
                  <span>Optional: Enter quick notes or leave blank for full AI auto-generation.</span>
                  {answers[idx]?.trim() && (
                    <button
                      type="button"
                      onClick={() => setAnswers({ ...answers, [idx]: "" })}
                      className="text-neutral-400 hover:text-neutral-200 underline"
                    >
                      Clear text
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep("ingest")}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Back to Source Setup
              </button>
              <button
                onClick={handleSynthesizePortfolio}
                disabled={generatingPortfolio}
                className="px-6 py-2.5 text-xs font-bold text-black bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Synthesize Live Portfolio with Gemini 3.6 Flash
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GENERATING STATE */}
        {step === "generating" && (
          <div className="text-center py-20 space-y-6">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <h2 className="text-2xl font-bold text-white">Synthesizing Developer Portfolio</h2>
            <p className="text-sm text-neutral-400 max-w-md mx-auto">
              Gemini AI is processing your external site data, GitHub repositories, and questionnaire answers to build your developer portfolio...
            </p>
          </div>
        )}

        {/* STEP 4: PREVIEW & PUBLIC LINK */}
        {step === "preview" && profile && (
          <div className="space-y-8">
            <div className="p-6 bg-neutral-900 border border-emerald-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-emerald-400 font-bold uppercase">
                  ✓ Portfolio Live & Synthesized
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Your Public Portfolio Link</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono text-neutral-300 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800 select-all">
                    {publicPortfolioUrl}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(publicPortfolioUrl);
                      alert("Public portfolio link copied to clipboard!");
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors"
                  >
                    Copy Link
                  </button>
                  <a
                    href={publicPortfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1.5 text-xs font-bold text-black bg-emerald-400 rounded hover:bg-emerald-300 transition-colors"
                  >
                    Open Live Page ↗
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("ingest")}
                  className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Edit Sources & Questionnaire
                </button>
              </div>
            </div>

            {/* Profile Overview Card */}
            <div className="p-8 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{profile.headline || "Developer Profile"}</h2>
                {profile.bio && <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{profile.bio}</p>}
              </div>

              {profile.services && Array.isArray(profile.services) && profile.services.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                    Services Offered
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.services.map((s: any, i: number) => (
                      <div key={i} className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                        <div className="text-sm font-bold text-white">{s.title}</div>
                        <div className="text-xs text-neutral-400">{s.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
