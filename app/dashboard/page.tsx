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
            Welcome back, {session?.user?.name || "User"} 👋
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
            ⚙️ Settings & Sync Profile
          </Link>
          {userRole === "CLIENT" ? (
            <Link
              href="/dashboard/marketplace"
              className="px-5 py-2.5 text-xs font-extrabold text-black bg-emerald-400 rounded-xl hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/10"
            >
              ➕ Post Job / Freelance Task
            </Link>
          ) : (
            <Link
              href="/dashboard/jobs"
              className="px-5 py-2.5 text-xs font-extrabold text-black bg-emerald-400 rounded-xl hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/10"
            >
              🚀 Apply to New Job
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
                <span className="text-emerald-400">🚀</span>
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.totalApplications}</div>
              <p className="text-[11px] text-neutral-500">Tracked in Job Applications Studio</p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Avg ATS Match Score</span>
                <span className="text-emerald-400">⚡</span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">{stats.avgMatchScore}%</div>
              <p className="text-[11px] text-neutral-500">Resume & Skill Keyword Alignment</p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Active Openings</span>
                <span className="text-emerald-400">💼</span>
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.activeJobs}</div>
              <p className="text-[11px] text-neutral-500">Applications currently pending/sent</p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Marketplace Jobs</span>
                <span className="text-emerald-400">🌐</span>
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
                <span className="text-emerald-400">💼</span>
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.marketplaceJobsCount}</div>
              <p className="text-[11px] text-neutral-500">Total listings published</p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Services Status</span>
                <span className="text-emerald-400">⚡</span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">Active</div>
              <p className="text-[11px] text-neutral-500">Hiring system operational</p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Profile Role</span>
                <span className="text-emerald-400">🏢</span>
              </div>
              <div className="text-xl font-extrabold text-white">Client / Employer</div>
              <p className="text-[11px] text-neutral-500">Can post freelance tasks</p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <span>Developer Network</span>
                <span className="text-emerald-400">🌐</span>
              </div>
              <div className="text-3xl font-extrabold text-white">Live</div>
              <p className="text-[11px] text-neutral-500">Verified GitHub developers</p>
            </div>
          </>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">⚡ Quick Tools & Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/dashboard/marketplace"
            className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-emerald-500/50 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              💼
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              🚀
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              🌐
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              📄
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              ⚙️
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
