/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<any>({
    totalApplications: 0,
    avgMatchScore: 0,
    activeJobs: 0,
    marketplaceJobsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const isRoleSelected = (session.user as any).roleSelected;
      if (isRoleSelected === false) {
        router.push("/dashboard/onboarding");
        return;
      }

      fetchDashboardStats();
    }
  }, [status, session, router]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/jobs");
      const data = await res.json();
      const apps = data.applications || [];

      const total = apps.length;
      const avgScore =
        total > 0
          ? Math.round(apps.reduce((acc: number, item: any) => acc + (item.matchScore || 0), 0) / total)
          : 0;

      const mRes = await fetch("/api/marketplace/jobs");
      const mData = await mRes.json();
      const mJobs = mData.jobs || [];

      setStats({
        totalApplications: total,
        avgMatchScore: avgScore,
        activeJobs: apps.filter((a: any) => a.status !== "REJECTED").length,
        marketplaceJobsCount: mJobs.length,
      });
    } catch (e) {
      console.error("Failed to load dashboard stats:", e);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="py-20 text-center">
        <span className="text-xs font-bold text-neutral-400 animate-pulse">
          Loading Analytics Dashboard...
        </span>
      </div>
    );
  }

  const userRole = (session?.user as any)?.role || "DEVELOPER";

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header Banner */}
      <div className="border-b border-neutral-800 pb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {userRole === "CLIENT" ? "Client / Buyer Mode" : "Developer / Seller Mode"}
            </span>
            <span className="text-xs text-neutral-400 font-mono">SaaS Analytics v2.0</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-white">
            Welcome back, {session?.user?.name || "User"}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            {userRole === "CLIENT"
              ? "Manage your active job postings, review developer applications, and post freelance tasks."
              : "Track your job applications, optimize resumes, browse freelance tasks, and build your portfolio."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings"
            className="px-4 py-2.5 text-xs font-bold text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition-colors"
          >
            Settings & Sync Profile
          </Link>
          {userRole === "CLIENT" ? (
            <Link
              href="/dashboard/marketplace"
              className="px-5 py-2.5 text-xs font-extrabold text-black bg-emerald-400 rounded-xl hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/10"
            >
              Post Job / Freelance Task
            </Link>
          ) : (
            <Link
              href="/dashboard/jobs"
              className="px-5 py-2.5 text-xs font-extrabold text-black bg-emerald-400 rounded-xl hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/10"
            >
              Apply to New Job
            </Link>
          )}
        </div>
      </div>

      {/* Analytics KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {userRole === "DEVELOPER" ? (
          <>
            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Applications Sent</span>
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.totalApplications}</div>
              <p className="text-[11px] text-neutral-500">Tracked in Job Applications Studio</p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Avg ATS Match Score</span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">{stats.avgMatchScore}%</div>
              <p className="text-[11px] text-neutral-500">Resume & Skill Keyword Alignment</p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Active Openings</span>
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.activeJobs}</div>
              <p className="text-[11px] text-neutral-500">Applications currently pending/sent</p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Marketplace Jobs</span>
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.marketplaceJobsCount}</div>
              <p className="text-[11px] text-neutral-500">Available tasks & roles</p>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Marketplace Jobs</span>
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.marketplaceJobsCount}</div>
              <p className="text-[11px] text-neutral-500">Total listings published</p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Services Status</span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">Active</div>
              <p className="text-[11px] text-neutral-500">Hiring system operational</p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Profile Role</span>
              </div>
              <div className="text-xl font-extrabold text-white">Client / Employer</div>
              <p className="text-[11px] text-neutral-500">Can post freelance tasks</p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Developer Network</span>
              </div>
              <div className="text-3xl font-extrabold text-white">Live</div>
              <p className="text-[11px] text-neutral-500">Verified GitHub developers</p>
            </div>
          </>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Quick Tools & Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/dashboard/marketplace"
            className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-emerald-500/50 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Freelance Tasks & Marketplace
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                {userRole === "CLIENT"
                  ? "Post full-time software roles or freelance tasks for developers."
                  : "Browse open listings and apply directly with 1-click tailored resume."}
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/jobs"
            className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-emerald-500/50 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Job Applications Studio
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Paste any Job Description to generate ATS cover letters, match scores, and AI screening Q&As.
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/portfolio"
            className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-emerald-500/50 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                GitHub Portfolio Builder
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Extract your GitHub repos and profile info into a public developer portfolio.
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/resume"
            className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-emerald-500/50 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Resume Studio & PDF Engine
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Build and export custom ATS-friendly PDF resumes tailored to your target engineering roles.
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/settings"
            className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-emerald-500/50 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Settings & Sync Profile
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Manage your account credentials, switch between Developer & Client roles, and sync GitHub repositories.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
