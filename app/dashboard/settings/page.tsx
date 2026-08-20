"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function SettingsAndSyncPage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"DEVELOPER" | "CLIENT">("DEVELOPER");

  // GitHub Sync State
  const [githubUsername, setGithubUsername] = useState("");
  const [githubToken, setGithubToken] = useState("");

  // User Custom SMTP Settings
  const [isSajid, setIsSajid] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [showAdvancedSmtp, setShowAdvancedSmtp] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, smtpRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/user/smtp"),
      ]);

      const data = await profileRes.json();
      if (!profileRes.ok) throw new Error(data.error || "Failed to fetch profile");

      setProfile(data.user);
      setName(data.user.name || "");
      setPhone(data.user.phone || "");
      setRole(data.user.role || "DEVELOPER");
      setGithubUsername(data.user.githubUsername || data.user.handle || "");

      if (data.user.profile) {
        setHeadline(data.user.profile.headline || "");
        setBio(data.user.profile.bio || "");
        setLocation(data.user.profile.location || "");
      }

      if (smtpRes.ok) {
        const smtpData = await smtpRes.json();
        setIsSajid(!!smtpData.isSajid);
        setSmtpConfigured(!!smtpData.isConfigured);
        setSmtpUser(smtpData.smtpUser || data.user.email || "");
        setSmtpFromName(smtpData.smtpFromName || data.user.name || "");
        setSmtpHost(smtpData.smtpHost || "smtp.gmail.com");
        setSmtpPort(smtpData.smtpPort || 587);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const handleSaveSmtp = async (testConnection = false) => {
    if (!smtpUser.trim() || !smtpPass.trim()) {
      setError("Please provide your Email Address and App Password.");
      return;
    }

    if (testConnection) setTestingSmtp(true);
    else setSavingSmtp(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/user/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim(),
          smtpFromName: smtpFromName.trim() || name.trim(),
          smtpHost: smtpHost.trim(),
          smtpPort: Number(smtpPort),
          testConnection,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save SMTP settings");

      setSmtpConfigured(true);
      setSmtpPass(""); // Clear sensitive password input
      setMessage(testConnection ? "✅ Connection Test Succeeded & Settings Saved!" : "✅ Personal Email/SMTP credentials saved successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTestingSmtp(false);
      setSavingSmtp(false);
    }
  };

  const handleClearSmtp = async () => {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/user/smtp", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear SMTP credentials");
      setSmtpConfigured(false);
      setSmtpPass("");
      setMessage("Custom SMTP settings cleared.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      // 1. Update basic profile info
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          headline,
          bio,
          location,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile settings");
      }

      // 2. Update role if changed
      if (role !== profile?.role) {
        await fetch("/api/user/role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        await update();
      }

      setMessage("Settings & profile updated successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncGithub = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!githubUsername.trim()) {
      setError("Please enter a GitHub username to sync.");
      return;
    }

    setSyncingGithub(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: githubUsername.trim(),
          accessToken: githubToken.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync GitHub data.");

      setMessage(`✅ GitHub Data Synced! Repositories: ${data.reposSynced ?? data.repoCount ?? 0}, Skills Detected: ${data.skillsAdded ?? 0}`);
      await fetchProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncingGithub(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <span className="text-xs font-bold text-neutral-400 animate-pulse">
          Loading Settings & Profile...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Settings & Profile</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage your account details, GitHub repositories, and secure outgoing email dispatch credentials.
          </p>
        </div>

        <button
          onClick={() => handleSyncGithub()}
          disabled={syncingGithub}
          className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2"
        >
          {syncingGithub ? (
            <>
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-black"></span>
              <span>Syncing GitHub...</span>
            </>
          ) : (
            <>
              <span>Sync GitHub Data Now</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-semibold">
          {error}
        </div>
      )}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-semibold">
          {message}
        </div>
      )}

      {/* GitHub Sync Card */}
      <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub Repositories & Data Sync</span>
          </h2>
          {profile?.lastGithubSyncAt && (
            <span className="text-[11px] text-neutral-400 font-mono">
              Last Synced: {new Date(profile.lastGithubSyncAt).toLocaleDateString()} {new Date(profile.lastGithubSyncAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <p className="text-xs text-neutral-400">
          Sync your public GitHub repositories, pinned projects, languages, and skills directly into Dev-Apply. No GitHub OAuth login required.
        </p>

        <form onSubmit={handleSyncGithub} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                GitHub Username <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-neutral-500 text-sm font-mono">@</span>
                <input
                  type="text"
                  required
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="e.g. sajidhossain8272"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Personal Access Token <span className="text-neutral-500 font-normal">(Optional, for private repos)</span>
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="text-[11px] text-neutral-500">
              💡 Public repositories and languages are fetched directly using your username.
            </div>
            <button
              type="submit"
              disabled={syncingGithub || !githubUsername.trim()}
              className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {syncingGithub ? (
                <>
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-black"></span>
                  <span>Syncing from GitHub...</span>
                </>
              ) : (
                <span>Fetch & Sync Repositories</span>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Outgoing Email & SMTP Dispatch Configuration */}
      <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Personal Outgoing Email & SMTP Settings</span>
          </h2>

          {isSajid ? (
            <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Admin Environment Active</span>
            </div>
          ) : smtpConfigured ? (
            <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Configured & Ready</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-amber-950/60 border border-amber-800/60 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Setup Required to Send</span>
            </div>
          )}
        </div>

        {isSajid ? (
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-2">
            <p className="font-bold text-neutral-200">
              Default Admin Account Integration Active
            </p>
            <p className="text-neutral-400">
              Job applications and automated messages for your account are dispatched directly via your server environment credentials (<span className="font-mono text-emerald-400">sajidhossain8272@gmail.com</span>).
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 space-y-1">
              <p className="font-bold text-neutral-200">🔒 Secure Per-User Email Isolation:</p>
              <p>
                Configure your own Gmail App Password or SMTP credentials below. When you dispatch job applications, they will be sent strictly from your own email. Other users will never have access to your credentials or email.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Your Sender Email <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={smtpFromName}
                  onChange={(e) => setSmtpFromName(e.target.value)}
                  placeholder="e.g. Alex Developer"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-neutral-300">
                  Google App Password / SMTP Password <span className="text-emerald-400">*</span>
                </label>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:underline font-bold"
                >
                  Generate Gmail App Password ↗
                </a>
              </div>
              <input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder={smtpConfigured ? "•••••••••••••••• (Leave blank to keep current password)" : "16-character Google App Password (e.g. abcd efgh ijkl mnop)"}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedSmtp(!showAdvancedSmtp)}
                className="text-xs font-bold text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                {showAdvancedSmtp ? "▼ Hide Advanced Server Settings" : "▶ Show Custom SMTP Host & Port Settings"}
              </button>

              {showAdvancedSmtp && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-neutral-800">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1">SMTP Server Host</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1">SMTP Port</label>
                    <input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      placeholder="587"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {smtpConfigured && (
                <button
                  type="button"
                  onClick={handleClearSmtp}
                  className="bg-neutral-800 hover:bg-red-950/60 hover:text-red-300 text-neutral-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                >
                  Clear SMTP Settings
                </button>
              )}

              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  disabled={testingSmtp || !smtpUser.trim() || !smtpPass.trim()}
                  onClick={() => handleSaveSmtp(true)}
                  className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                >
                  {testingSmtp ? "Testing..." : "Test Connection & Save"}
                </button>

                <button
                  type="button"
                  disabled={savingSmtp || !smtpUser.trim() || !smtpPass.trim()}
                  onClick={() => handleSaveSmtp(false)}
                  className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                  {savingSmtp ? "Saving..." : "Save Email Settings"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Profile & Account Settings Form */}
      <form onSubmit={handleSaveProfile} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-bold text-white">Profile Settings</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="DEVELOPER">Developer / Engineer (Seller)</option>
              <option value="CLIENT">Client / Employer (Buyer)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-1">Professional Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Senior Full Stack Developer (React / Node / Django)"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Dhaka, Bangladesh / Remote"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+8801700000000"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-400 mb-1">Bio / Profile Summary</label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell developers or clients about your experience..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
          >
            {saving ? "Saving Changes..." : "Save Settings & Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
