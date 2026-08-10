"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRole = async (role: "DEVELOPER" | "CLIENT") => {
    setLoading(role);
    setError(null);

    try {
      const res = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set user role.");

      await update();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Welcome to Dev-Apply
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          How do you plan to use Dev-Apply?
        </h1>
        <p className="text-sm text-neutral-400 max-w-xl mx-auto">
          Choose your primary profile role. You can manage settings and sync your GitHub data at any time from your dashboard.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-semibold text-center max-w-md mx-auto">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Role 1: Developer (Seller) */}
        <div className="bg-neutral-900/80 border border-neutral-800 hover:border-emerald-500/50 rounded-2xl p-8 space-y-6 flex flex-col justify-between transition-all group">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Developer / Engineer</h2>
              <p className="text-xs text-neutral-400 mt-1">
                (Seller Profile)
              </p>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Build your live portfolio from GitHub, generate ATS-tailored resumes, answer AI screening questions, and apply to job postings and freelance tasks.
            </p>
            <ul className="text-xs text-neutral-400 space-y-2 pt-2">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Job Applications Studio & AI Cover Letter</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Automatic GitHub Portfolio Builder</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Tailored Resume Engine & AI Q&A</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectRole("DEVELOPER")}
            disabled={loading === "DEVELOPER"}
            className="w-full bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-extrabold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
          >
            {loading === "DEVELOPER" ? "Joining as Developer..." : "Join as Developer"}
          </button>
        </div>

        {/* Role 2: Client / Employer (Buyer) */}
        <div className="bg-neutral-900/80 border border-neutral-800 hover:border-emerald-500/50 rounded-2xl p-8 space-y-6 flex flex-col justify-between transition-all group">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H7m4 0v10" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Client / Employer</h2>
              <p className="text-xs text-neutral-400 mt-1">
                (Buyer Profile)
              </p>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Post job descriptions and freelance engineering tasks, receive applications from qualified developers, and hire top tech talent.
            </p>
            <ul className="text-xs text-neutral-400 space-y-2 pt-2">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Post Full-Time, Contract & Freelance Tasks</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Receive Tailored Applications & Resumes</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Manage Hiring Postings & Marketplace Listings</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectRole("CLIENT")}
            disabled={loading === "CLIENT"}
            className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all"
          >
            {loading === "CLIENT" ? "Joining as Client..." : "Join as Client / Employer"}
          </button>
        </div>
      </div>
    </div>
  );
}
