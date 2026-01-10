/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { PortfolioCLI } from "@/components/dashboard/PortfolioCLI";
import type {
  ProfileInput,
  ExperienceInput,
  ProjectInput,
  SkillInput,
} from "@/lib/types";

const emptyProfile: ProfileInput = {
  name: "",
  handle: "",
  headline: "",
  bio: "",
  location: "",
  currentCompany: "",
  currentRole: "",
  availability: "OPEN",
  theme: "dark",
  links: {
    github: "",
    linkedin: "",
    website: "",
    twitter: "",
  },
  experiences: [],
  projects: [],
  skills: [],
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileInput>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // GitHub Integration State
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile context");
      const data = await res.json();
      const user = data.user;
      const p = user.profile;

      setGithubConnected(!!user.githubAccessToken || (user.accounts && user.accounts.length > 0));
      setLastSyncedAt(user.lastGithubSyncAt);
      setGithubUsername(user.githubUsername);

      const mapped: ProfileInput = {
        name: user.name ?? "",
        handle: user.handle ?? "",
        headline: p?.headline ?? "",
        bio: p?.bio ?? "",
        location: p?.location ?? "",
        currentCompany: p?.currentCompany ?? "",
        currentRole: p?.currentRole ?? "",
        availability: user.settings?.availability ?? "OPEN",
        theme: user.settings?.theme ?? "dark",
        links: {
          github: p?.githubUrl ?? "",
          linkedin: p?.linkedinUrl ?? "",
          website: p?.websiteUrl ?? "",
          twitter: p?.twitterUrl ?? "",
        },
        experiences:
          p?.experiences?.map((exp: any): ExperienceInput => ({
            id: exp.id,
            company: exp.company,
            title: exp.title,
            location: exp.location ?? "",
            startDate: exp.startDate?.slice(0, 10),
            endDate: exp.endDate ? exp.endDate.slice(0, 10) : null,
            isCurrent: exp.isCurrent,
            description: exp.description ?? "",
          })) ?? [],
        projects:
          p?.projects?.map((proj: any): ProjectInput => ({
            id: proj.id,
            name: proj.name,
            description: proj.description ?? "",
            url: proj.url ?? "",
            highlight: proj.highlight,
            techStack: proj.techStack ?? "",
          })) ?? [],
        skills:
          p?.skills?.map((s: any): SkillInput => ({
            id: s.id,
            name: s.name,
            level: s.level ?? "",
          })) ?? [],
      };
      setProfile(mapped);
    } catch (err: any) {
      setError(err.message || "Failed to initialize profile connection");
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

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    setProfile(prev => ({ ...prev, theme: newTheme }));
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleCLICommand = async (command: string) => {
    try {
      const res = await fetch("/api/cli", {
        method: "POST",
        body: JSON.stringify({ command }),
      });
      const data = await res.json();

      if (data.response === "CLEAR_SIGNAL") {
        return "CONSOLE BUFFER PURGED.";
      }

      const cmd = command.toLowerCase().split(" ")[0];
      if (cmd === "sync" || cmd === "rollback") {
        await loadProfile();
      }

      return data.response;
    } catch (e) {
      return "ERROR: COMMUNICATIONS FAILURE WITH ENGINE.";
    }
  };

  const handleFieldChange = (field: keyof ProfileInput, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updateLink = (key: keyof ProfileInput["links"], value: string) => {
    setProfile((prev) => ({
      ...prev,
      links: { ...prev.links, [key]: value },
    }));
  };

  const addExperience = () => {
    const iso = new Date().toISOString().slice(0, 10);
    setProfile((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        { company: "", title: "", location: "", startDate: iso, endDate: null, isCurrent: true, description: "" },
      ],
    }));
  };

  const updateExperience = (index: number, patch: Partial<ExperienceInput>) => {
    setProfile((prev) => {
      const copy = [...prev.experiences];
      copy[index] = { ...copy[index], ...patch };
      return { ...prev, experiences: copy };
    });
  };

  const removeExperience = (index: number) => {
    setProfile((prev) => {
      const copy = [...prev.experiences];
      copy.splice(index, 1);
      return { ...prev, experiences: copy };
    });
  };

  const addProject = () => {
    setProfile((prev) => ({
      ...prev,
      projects: [...prev.projects, { name: "", description: "", url: "", highlight: false, techStack: "" }],
    }));
  };

  const updateProject = (index: number, patch: Partial<ProjectInput>) => {
    setProfile((prev) => {
      const copy = [...prev.projects];
      copy[index] = { ...copy[index], ...patch };
      return { ...prev, projects: copy };
    });
  };

  const removeProject = (index: number) => {
    setProfile((prev) => {
      const copy = [...prev.projects];
      copy.splice(index, 1);
      return { ...prev, projects: copy };
    });
  };

  const addSkill = () => {
    setProfile((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: "", level: "" }],
    }));
  };

  const updateSkill = (index: number, patch: Partial<SkillInput>) => {
    setProfile((prev) => {
      const copy = [...prev.skills];
      copy[index] = { ...copy[index], ...patch };
      return { ...prev, skills: copy };
    });
  };

  const removeSkill = (index: number) => {
    setProfile((prev) => {
      const copy = [...prev.skills];
      copy.splice(index, 1);
      return { ...prev, skills: copy };
    });
  };

  const handleGitHubSync = async () => {
    setError(null);
    setMessage(null);
    setSyncing(true);
    try {
      const res = await fetch("/api/github/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync GitHub");
      setMessage(`Sync Success! Imported ${data.repoCount} projects.`);
      await loadProfile();
    } catch (err: any) {
      setError(err.message ?? "Failed to sync GitHub");
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to commit changes");
      }
      setMessage("Success: Profile deployed and versioned.");
    } catch (err: any) {
      setError(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-8">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-[var(--fg)]">Access Denied</h1>
        <p className="text-[var(--muted)] max-w-sm">Connect your GitHub account to manage your professional identity.</p>
        <Button onClick={() => signIn("github")}>Authorize GitHub</Button>
      </div>
    );
  }

  if (loading || status === "loading") {
    return (
      <div className="py-32 text-center">
        <span className="text-xs font-black uppercase tracking-[0.5em] animate-pulse">Initializing...</span>
      </div>
    );
  }

  const publicUrl = profile.handle && `/u/${profile.handle}`;

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-20">
      <header className="space-y-4 border-b border-[var(--border)] pb-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tighter uppercase text-[var(--fg)]">Command Center</h1>
            <p className="text-sm font-medium text-[var(--muted)] uppercase tracking-widest">Profile Configuration</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="h-10 text-[10px]" onClick={toggleTheme}>
              {theme === "dark" ? "LIGHT MODE" : "DARK MODE"}
            </Button>
            {publicUrl && (
              <a href={publicUrl} target="_blank" className="no-underline">
                <Button variant="outline" className="h-10">Preview Portfolio</Button>
              </a>
            )}
            <Button onClick={handleSave} disabled={saving} className="h-10">
              {saving ? "Deploying..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {(!profile.handle || !profile.bio) && (
          <div className="mt-8 border border-[var(--fg)] p-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff3333]">Attention Required</span>
            <span className="text-[10px] text-[var(--muted)] uppercase">Handle and Bio are necessary for public deployment</span>
          </div>
        )}
      </header>

      {/* Advanced Shell Interface */}
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--muted)]">Advanced Shell</h2>
          <div className="h-[1px] flex-1 bg-[var(--border)]" />
        </div>
        <PortfolioCLI onCommand={handleCLICommand} />
      </section>

      {error && <div className="border border-[var(--fg)] p-4 text-[10px] font-bold uppercase text-[var(--fg)]">{error}</div>}
      {message && <div className="border border-[var(--border)] p-4 text-[10px] font-bold uppercase text-[var(--muted)]">{message}</div>}

      <div className="grid grid-cols-1 gap-20">
        {/* GitHub Command */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--muted)]">GitHub Source</h2>
            <div className="h-[1px] flex-1 bg-[var(--border)]" />
          </div>
          <div className="flex flex-col justify-between gap-6 border border-[var(--border)] p-8 sm:flex-row sm:items-center bg-[var(--surface)]">
            <div className="space-y-2">
              <h3 className="text-lg font-bold uppercase text-[var(--fg)]">{githubConnected ? (githubUsername || "ENGINE CONNECTED") : "NOT CONNECTED"}</h3>
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
                {lastSyncedAt ? `Last Sync: ${new Date(lastSyncedAt).toLocaleString()}` : "Automatic sync recommended"}
              </p>
            </div>
            <div className="flex gap-4">
              <Button onClick={handleGitHubSync} disabled={syncing} variant="outline">
                {syncing ? "Syncing..." : "Force Re-Sync"}
              </Button>
            </div>
          </div>
        </section>

        {/* Basic Intelligence */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--muted)]">Core Metadata</h2>
            <div className="h-[1px] flex-1 bg-[var(--border)]" />
          </div>
          <div className="grid gap-12 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Legal Name</label>
              <input
                className="w-full bg-transparent border-b border-[var(--border)] py-2 outline-none focus:border-[var(--fg)] transition-colors text-[var(--fg)]"
                value={profile.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Public Handle</label>
              <input
                className="w-full bg-transparent border-b border-[var(--border)] py-2 outline-none focus:border-[var(--fg)] transition-colors text-[var(--fg)]"
                value={profile.handle}
                onChange={(e) => handleFieldChange("handle", e.target.value)}
                placeholder="Unique ID"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Professional Headline</label>
            <input
              className="w-full bg-transparent border-b border-[var(--border)] py-2 outline-none focus:border-[var(--fg)] transition-colors text-[var(--fg)]"
              value={profile.headline ?? ""}
              onChange={(e) => handleFieldChange("headline", e.target.value)}
              placeholder="e.g. SYSTEMS ARCHITECT // FULL STACK"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Biography</label>
            <textarea
              className="w-full bg-transparent border border-[var(--border)] p-4 min-h-[160px] outline-none focus:border-[var(--fg)] transition-colors resize-none text-[var(--fg)]"
              value={profile.bio ?? ""}
              onChange={(e) => handleFieldChange("bio", e.target.value)}
            />
          </div>
        </section>

        {/* Professional History */}
        <section className="space-y-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--muted)]">Professional History</h2>
            <Button onClick={addExperience} variant="ghost" className="h-8 text-[10px]">+ Add Entry</Button>
          </div>
          <div className="space-y-12">
            {profile.experiences.map((exp, index) => (
              <div key={index} className="group relative border-l border-[var(--border)] pl-8 transition-colors hover:border-[var(--fg)]">
                <button
                  onClick={() => removeExperience(index)}
                  className="absolute -right-4 top-0 text-[10px] font-black uppercase text-[var(--muted)] hover:text-[#ff3333] transition-colors"
                >
                  Delete
                </button>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Organization</label>
                    <input
                      className="w-full bg-transparent border-b border-[var(--border)] py-2 outline-none focus:border-[var(--fg)] transition-colors text-[var(--fg)]"
                      value={exp.company}
                      onChange={(e) => updateExperience(index, { company: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Role Title</label>
                    <input
                      className="w-full bg-transparent border-b border-[var(--border)] py-2 outline-none focus:border-[var(--fg)] transition-colors text-[var(--fg)]"
                      value={exp.title}
                      onChange={(e) => updateExperience(index, { title: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-8 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Impact Summary</label>
                  <textarea
                    className="w-full bg-transparent border-b border-[var(--border)] py-2 outline-none focus:border-[var(--fg)] transition-colors resize-none text-[var(--fg)]"
                    value={exp.description ?? ""}
                    onChange={(e) => updateExperience(index, { description: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Intelligence Assets */}
        <section className="space-y-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--muted)]">Project Assets</h2>
            <Button onClick={addProject} variant="ghost" className="h-8 text-[10px]">+ Add Asset</Button>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {profile.projects.map((proj, index) => (
              <div key={index} className="border border-[var(--border)] p-8 space-y-6 relative hover:border-[var(--fg)] transition-colors bg-[var(--surface)]">
                <button
                  onClick={() => removeProject(index)}
                  className="absolute right-4 top-4 text-[10px] font-black uppercase text-[var(--muted)] hover:text-[#ff3333]"
                >
                  ×
                </button>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Name</label>
                  <input
                    className="w-full bg-transparent border-b border-[var(--border)] py-1 outline-none text-sm font-bold uppercase text-[var(--fg)]"
                    value={proj.name}
                    onChange={(e) => updateProject(index, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Description</label>
                  <textarea
                    className="w-full bg-transparent border-b border-[var(--border)] py-1 outline-none text-xs text-[var(--muted)] resize-none h-12"
                    value={proj.description ?? ""}
                    onChange={(e) => updateProject(index, { description: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="space-y-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--muted)]">Skills</h2>
            <Button onClick={addSkill} variant="ghost" className="h-8 text-[10px]">+ Add Skill</Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {profile.skills.map((skill, index) => (
              <div key={index} className="border border-[var(--border)] p-4 relative group bg-[var(--surface)]">
                <button
                  onClick={() => removeSkill(index)}
                  className="absolute right-2 top-2 text-[8px] font-black uppercase text-[var(--muted)] hover:text-[#ff3333]"
                >
                  ×
                </button>
                <input
                  className="w-full bg-transparent border-b border-[var(--border)] py-1 outline-none text-[10px] font-bold uppercase text-[var(--fg)]"
                  value={skill.name}
                  onChange={(e) => updateSkill(index, { name: e.target.value })}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="pt-20 border-t border-[var(--border)]">
        <Button onClick={handleSave} disabled={saving} className="w-full h-16 text-sm">
          {saving ? "Deploying Changes..." : "Commit All Updates"}
        </Button>
      </footer>
    </div>
  );
}
