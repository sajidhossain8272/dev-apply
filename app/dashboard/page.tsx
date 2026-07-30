/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function DashboardPage() {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Settings State
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [birthYear, setBirthYear] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [availability, setAvailability] = useState<"OPEN" | "BUSY" | "NOT_LOOKING">("OPEN");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // GitHub Integration State
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load account settings");
      const data = await res.json();
      const user = data.user;

      setGithubConnected(!!user.githubAccessToken || (user.accounts && user.accounts.length > 0));
      setLastSyncedAt(user.lastGithubSyncAt);
      setGithubUsername(user.githubUsername);

      setName(user.name || "");
      setHandle(user.handle || "");
      setBirthYear(user.birthYear || "");
      setPhone(user.phone || "");
      setAvailability(user.settings?.availability || "OPEN");
      setTheme(user.settings?.theme || "dark");
    } catch (err: any) {
      setError(err.message || "Failed to initialize settings connection");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      loadProfile();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, loadProfile]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          handle,
          birthYear: birthYear ? Number(birthYear) : null,
          phone,
          availability,
          theme,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update settings");
      }

      setMessage("Account settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncGithub = async () => {
    try {
      setSyncing(true);
      setError(null);
      setMessage(null);

      const res = await fetch("/api/github/sync", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sync GitHub data");
      }

      const data = await res.json();
      setMessage(`GitHub synced! Imported ${data.repoCount} repositories.`);
      loadProfile();
    } catch (err: any) {
      setError(err.message || "GitHub sync failed");
    } finally {
      setSyncing(false);
    }
  };

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
        <h1 className="text-3xl font-extrabold mb-4">Welcome to Dev-Apply</h1>
        <p className="text-sm text-neutral-400 mb-8 max-w-md">
          Sign in to access your Developer Dashboard, AI Portfolio Studio, and AI Resume Studio.
        </p>
        <Button onClick={() => signIn("github")} className="bg-emerald-400 text-black font-bold px-6 py-3">
          Sign In with GitHub
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500 selection:text-black">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {/* Header */}
        <div className="border-b border-neutral-800 pb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-100">
            Developer Navigation & Account Settings
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage your personal profile settings or launch our dedicated AI Studios.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-200 text-sm">
            {message}
          </div>
        )}

        {/* AI Studios Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Portfolio Studio Card */}
          <Link
            href="/dashboard/portfolio"
            className="p-6 bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/40 border border-neutral-800 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 group shadow-xl hover:shadow-emerald-500/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Studio 1
              </span>
              <span className="text-xs text-emerald-400 group-hover:translate-x-1 transition-transform font-bold">
                Launch Studio ↗
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                🚀 AI Portfolio Studio
              </h2>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Build & enhance your live public portfolio. Extract experience from external URLs (like your live site), paste PDF text, sync GitHub repos, and showcase custom services.
              </p>
            </div>
            <div className="pt-2 text-[11px] text-neutral-500 font-mono">
              Features: External URL Extractor • GitHub Sync • Custom Services • Public Page /u/{handle || "slug"}
            </div>
          </Link>

          {/* AI Resume Studio Card */}
          <Link
            href="/dashboard/resume"
            className="p-6 bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/40 border border-neutral-800 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 group shadow-xl hover:shadow-emerald-500/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Studio 2
              </span>
              <span className="text-xs text-emerald-400 group-hover:translate-x-1 transition-transform font-bold">
                Launch Studio ↗
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                📄 AI Resume Studio
              </h2>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Generate ATS-friendly downloadable engineering resumes in Modern Tech & Compact Minimalist layouts with print and PDF export support.
              </p>
            </div>
            <div className="pt-2 text-[11px] text-neutral-500 font-mono">
              Features: Multi-Model Gemini Pipeline • PDF & Print Export • Dedicated URLs per Style
            </div>
          </Link>
        </div>

        {/* Account Settings Form */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 space-y-6">
          <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Account & Personal Settings</h3>
              <p className="text-xs text-neutral-400">
                Manage basic account identity, contact information, and availability status.
              </p>
            </div>
            {githubConnected && (
              <button
                type="button"
                onClick={handleSyncGithub}
                disabled={syncing}
                className="px-3.5 py-1.5 text-xs font-bold text-neutral-300 bg-neutral-900 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {syncing ? (
                  <>
                    <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    Sync GitHub Data
                  </>
                )}
              </button>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sajid Hossain"
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Public Handle / Username
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g. sajidhossain"
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">Birth Year (Optional)</label>
                <input
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value ? parseInt(e.target.value) : "")}
                  placeholder="e.g. 2000"
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +8801329530468"
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Job Availability Status
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="OPEN">Available for New Opportunities (Open)</option>
                  <option value="BUSY">Busy / Employed</option>
                  <option value="NOT_LOOKING">Not Looking</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">Theme Mode</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="dark">Dark Theme (Default)</option>
                  <option value="light">Light Theme</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <div className="text-xs text-neutral-500">
                {lastSyncedAt
                  ? `Last GitHub sync: ${new Date(lastSyncedAt).toLocaleString()}`
                  : "GitHub account connected"}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-xs font-bold text-black bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {saving ? "Saving Settings..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
