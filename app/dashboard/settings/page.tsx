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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch profile");

      setProfile(data.user);
      setName(data.user.name || "");
      setPhone(data.user.phone || "");
      setRole(data.user.role || "DEVELOPER");

      if (data.user.profile) {
        setHeadline(data.user.profile.headline || "");
        setBio(data.user.profile.bio || "");
        setLocation(data.user.profile.location || "");
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

  const handleSyncGithub = async () => {
    setSyncingGithub(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/github/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync GitHub data.");

      setMessage(`GitHub Data Synced! Repositories: ${data.reposSynced || 0}`);
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Settings & Sync Profile</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage your account details, switch roles, and sync your GitHub repositories.
          </p>
        </div>

        <button
          onClick={handleSyncGithub}
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

      {/* GitHub Sync Status Card */}
      <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>GitHub Account Integration</span>
        </h2>
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-200">GitHub Username:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {profile?.githubUsername || profile?.handle || "Not Connected"}
              </span>
            </div>
            <p className="text-neutral-400">
              {profile?.lastGithubSyncAt
                ? `Last Synced: ${new Date(profile.lastGithubSyncAt).toLocaleString()}`
                : "No manual sync performed yet."}
            </p>
          </div>

          <button
            onClick={handleSyncGithub}
            disabled={syncingGithub}
            className="bg-neutral-800 hover:bg-neutral-700 text-xs font-bold px-4 py-2 rounded-lg text-neutral-200 transition-colors"
          >
            Re-Sync GitHub Data
          </button>
        </div>
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
