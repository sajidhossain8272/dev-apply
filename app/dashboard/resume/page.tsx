/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ResumeView, ResumeData } from "@/components/resume/ResumeView";

interface QuestionItem {
  question: string;
  category?: string;
  hint?: string;
  answer?: string;
}

export default function ResumeBuilderPage() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState<"intro" | "questions" | "generating" | "preview">("intro");
  
  // Questionnaire State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState<Record<number, boolean>>({});
  const [generatingResume, setGeneratingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resume State
  const [templateStyle, setTemplateStyle] = useState<"SAJID_STANDARD" | "MEHRAB_MINIMAL">("SAJID_STANDARD");
  const [currentResume, setCurrentResume] = useState<any | null>(null);
  const [userResumes, setUserResumes] = useState<any[]>([]);

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

  // Fetch Existing Resumes on Mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchUserResumes();
    }
  }, [status]);

  const fetchUserResumes = async () => {
    try {
      const res = await fetch("/api/resume");
      if (res.ok) {
        const data = await res.json();
        setUserResumes(data.resumes || []);
        if (data.resumes && data.resumes.length > 0) {
          setCurrentResume(data.resumes[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load user resumes:", err);
    }
  };

  const handleStartQuestionnaire = async () => {
    try {
      setLoadingQuestions(true);
      setError(null);
      const res = await fetch("/api/resume/questionnaire", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate questions.");
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

  const handleGenerateResume = async () => {
    try {
      setGeneratingResume(true);
      setStep("generating");
      setError(null);

      const formattedAnswers = questions.map((q, idx) => ({
        question: q.question,
        category: q.category,
        answer: answers[idx] || "",
      }));

      const res = await fetch("/api/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: formattedAnswers,
          style: templateStyle,
          title: `Resume - ${new Date().toLocaleDateString()}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to synthesize resume.");
      }

      const data = await res.json();
      setCurrentResume(data.resume);
      setUserResumes((prev) => [data.resume, ...prev]);
      setStep("preview");
    } catch (err: any) {
      setError(err.message || "Failed to generate resume.");
      setStep("questions");
    } finally {
      setGeneratingResume(false);
    }
  };

  const handleStyleChange = async (newStyle: "SAJID_STANDARD" | "MEHRAB_MINIMAL") => {
    setTemplateStyle(newStyle);
    if (currentResume && currentResume.id) {
      try {
        const res = await fetch(`/api/resume/${currentResume.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateStyle: newStyle }),
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentResume(data.resume);
        }
      } catch (err) {
        console.error("Failed to update resume style in DB:", err);
      }
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
  const variantSlug = templateStyle === "MEHRAB_MINIMAL" ? "minimal" : "standard";
  const publicShareUrl = currentResume ? `${appUrl}/r/${currentResume.slug}/${variantSlug}` : "";

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500 selection:text-black">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI Powered Resume Engine
              </span>
              <span className="text-xs text-neutral-400">Gemini 3.6 Flash / 3.1 Flash Lite Pipeline</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-neutral-100">
              Developer Resume Studio
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Generate ATS-friendly resumes styled in Modern Tech & Compact Minimalist layouts using AI and GitHub context.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={handleStartQuestionnaire}
              disabled={loadingQuestions}
              className="px-4 py-2 text-xs font-bold text-black bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {loadingQuestions ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full"></span>
                  Crafting AI Questions...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  Create New AI Resume
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* STEP 1: INTRO & HISTORY */}
        {step === "intro" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Modern Tech Standard Template Card */}
              <div
                onClick={() => setTemplateStyle("SAJID_STANDARD")}
                className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                  templateStyle === "SAJID_STANDARD"
                    ? "bg-neutral-900/90 border-emerald-500 ring-1 ring-emerald-500"
                    : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Template 1
                  </span>
                  {templateStyle === "SAJID_STANDARD" && (
                    <span className="text-xs bg-emerald-500 text-black px-2 py-0.5 rounded-full font-bold">
                      Selected
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Modern Tech (Standard)</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  Comprehensive engineering layout featuring uppercase headers, detailed project links (Website & Repository), structured experience bullets, and two-column bottom layout.
                </p>
                <div className="text-[11px] text-neutral-500 font-mono">
                  Best for: Mid-to-Senior Engineers, Fullstack Developers, Portfolio showcase.
                </div>
              </div>

              {/* Compact Minimalist Template Card */}
              <div
                onClick={() => setTemplateStyle("MEHRAB_MINIMAL")}
                className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                  templateStyle === "MEHRAB_MINIMAL"
                    ? "bg-neutral-900/90 border-emerald-500 ring-1 ring-emerald-500"
                    : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Template 2
                  </span>
                  {templateStyle === "MEHRAB_MINIMAL" && (
                    <span className="text-xs bg-emerald-500 text-black px-2 py-0.5 rounded-full font-bold">
                      Selected
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Compact (Minimalist)</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  High-density, clean single-page format. Optimized for rapid recruiter scans, tight line heights, and compact skill listings.
                </p>
                <div className="text-[11px] text-neutral-500 font-mono">
                  Best for: Executive summaries, high-density applications, single-page print.
                </div>
              </div>
            </div>

            {/* Generated Resumes History */}
            {userResumes.length > 0 && (
              <div className="mt-12">
                <h2 className="text-lg font-bold text-neutral-200 mb-4">Your Generated Resumes</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userResumes.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        setCurrentResume(r);
                        setTemplateStyle(r.templateStyle || "SAJID_STANDARD");
                        setStep("preview");
                      }}
                      className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl hover:border-neutral-700 cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-400">
                          {r.templateStyle === "MEHRAB_MINIMAL" ? "Compact Minimalist" : "Modern Tech Standard"}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {r.title || "Developer Resume"}
                      </h4>
                      <div className="text-xs text-neutral-400 truncate">
                        Slug: /r/{r.slug}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: INTERACTIVE QUESTIONNAIRE */}
        {step === "questions" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Interactive AI Resume Questionnaire</h2>
                <span className="text-xs text-emerald-400 font-bold">Step 2 of 3</span>
              </div>
              <p className="text-xs text-neutral-400">
                Our Gemini AI analyzed your profile and GitHub repositories. Answer these tailored questions to help us write high-impact ATS bullet points!
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
                    placeholder="Type notes or click 'Write with AI' (leave empty to auto-generate based on GitHub & profile)..."
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
                onClick={() => setStep("intro")}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateResume}
                disabled={generatingResume}
                className="px-6 py-2.5 text-xs font-bold text-black bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Synthesize ATS Resume with Gemini 3.6 Flash
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GENERATING LOADING STATE */}
        {step === "generating" && (
          <div className="text-center py-20 space-y-6">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <h2 className="text-2xl font-bold text-white">Synthesizing Your Resume</h2>
            <p className="text-sm text-neutral-400 max-w-md mx-auto">
              Gemini AI is processing your GitHub projects, manual profile, and questionnaire responses into an ATS-friendly, professional document...
            </p>
          </div>
        )}

        {/* STEP 4: LIVE PREVIEW & ACTIONS */}
        {step === "preview" && currentResume && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <div>
                <span className="text-xs text-emerald-400 font-bold uppercase">
                  {templateStyle === "MEHRAB_MINIMAL" ? "Compact Minimalist URL" : "Modern Tech Standard URL"}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-neutral-300 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800 select-all">
                    {publicShareUrl}
                  </span>
                  <a
                    href={publicShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    Open Page ↗
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("intro")}
                  className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  All Resumes
                </button>
                <button
                  onClick={handleStartQuestionnaire}
                  className="px-4 py-2 text-xs font-bold text-black bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>

            {/* Render Resume Paper View */}
            <ResumeView
              data={currentResume.content as ResumeData}
              style={templateStyle}
              onStyleChange={handleStyleChange}
              publicUrl={publicShareUrl}
            />
          </div>
        )}
      </main>
    </div>
  );
}
