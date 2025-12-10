/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
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

  useEffect(() => {
    if (status === "authenticated") {
      (async () => {
        try {
          setLoading(true);
          const res = await fetch("/api/profile");
          if (!res.ok) throw new Error("Failed to load profile");
          const data = await res.json();
          const user = data.user;
          const p = user.profile;

          const mapped: ProfileInput = {
            name: user.name ?? "",
            handle: user.handle ?? "",
            headline: p?.headline ?? "",
            bio: p?.bio ?? "",
            location: p?.location ?? "",
            currentCompany: p?.currentCompany ?? "",
            currentRole: p?.currentRole ?? "",
            availability: user.settings?.availability ?? "OPEN",
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
          console.error(err);
          setError(err.message ?? "Error loading profile");
        } finally {
          setLoading(false);
        }
      })();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const handleFieldChange = (
    field: keyof ProfileInput,
    value: ProfileInput[typeof field]
  ) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updateLink = (key: keyof ProfileInput["links"], value: string) => {
    setProfile((prev) => ({
      ...prev,
      links: { ...prev.links, [key]: value },
    }));
  };

  const addExperience = () => {
    const now = new Date();
    const iso = now.toISOString().slice(0, 10);
    setProfile((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          company: "",
          title: "",
          location: "",
          startDate: iso,
          endDate: null,
          isCurrent: true,
          description: "",
        },
      ],
    }));
  };

  const updateExperience = (
    index: number,
    patch: Partial<ExperienceInput>
  ) => {
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
      projects: [
        ...prev.projects,
        {
          name: "",
          description: "",
          url: "",
          highlight: false,
          techStack: "",
        },
      ],
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

  const handleSave = async () => {
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to save profile");
      }

      setMessage("Profile saved and public page updated.");
    } catch (err: any) {
      setError(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-slate-300">
          Sign in with GitHub to create your resume and portfolio.
        </p>
        <Button onClick={() => signIn("github")}>
          Sign in with GitHub
        </Button>
      </div>
    );
  }

  if (loading || status === "loading") {
    return <p className="text-sm text-slate-300">Loading dashboard…</p>;
  }

  const publicUrl =
    profile.handle &&
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/u/${
      profile.handle
    }`;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">
          Resume & Portfolio
        </h1>
        <p className="text-sm text-slate-300">
          Fill this once. We’ll generate an ATS-friendly resume and a public
          portfolio page for you.
        </p>
        {publicUrl && (
          <p className="text-xs text-slate-400">
            Public URL:&nbsp;
            <a
              href={`/u/${profile.handle}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono"
            >
              /u/{profile.handle}
            </a>
          </p>
        )}
      </section>

      {error && (
        <p className="rounded-lg border border-red-500/60 bg-red-950/40 p-3 text-xs text-red-200">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-emerald-500/60 bg-emerald-950/40 p-3 text-xs text-emerald-200">
          {message}
        </p>
      )}

      {/* Basic info */}
      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
        <h2 className="text-sm font-semibold text-slate-100">
          Basic information
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            Name
            <input
              className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
              value={profile.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Handle (for /u/handle)
            <input
              className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
              value={profile.handle}
              onChange={(e) => handleFieldChange("handle", e.target.value)}
              placeholder="your-name"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs">
          Headline
          <input
            className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
            value={profile.headline ?? ""}
            onChange={(e) => handleFieldChange("headline", e.target.value)}
            placeholder="Full-stack developer, TypeScript, Next.js"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Short bio (max ~1000 chars)
          <textarea
            className="min-h-[80px] rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
            value={profile.bio ?? ""}
            onChange={(e) => handleFieldChange("bio", e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            Location
            <input
              className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
              value={profile.location ?? ""}
              onChange={(e) => handleFieldChange("location", e.target.value)}
              placeholder="Dhaka, Bangladesh"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Availability
            <select
              className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
              value={profile.availability}
              onChange={(e) =>
                handleFieldChange(
                  "availability",
                  e.target.value as ProfileInput["availability"]
                )
              }
            >
              <option value="OPEN">Open to work</option>
              <option value="BUSY">Busy but open to offers</option>
              <option value="NOT_LOOKING">Not looking</option>
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            Current role
            <input
              className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
              value={profile.currentRole ?? ""}
              onChange={(e) =>
                handleFieldChange("currentRole", e.target.value)
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Current company
            <input
              className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
              value={profile.currentCompany ?? ""}
              onChange={(e) =>
                handleFieldChange("currentCompany", e.target.value)
              }
            />
          </label>
        </div>
      </section>

      {/* Links */}
      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Links</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            GitHub
            <input
              className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
              value={profile.links.github ?? ""}
              onChange={(e) => updateLink("github", e.target.value)}
              placeholder="https://github.com/yourname"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            LinkedIn
            <input
              className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
              value={profile.links.linkedin ?? ""}
              onChange={(e) => updateLink("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Website
            <input
              className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
              value={profile.links.website ?? ""}
              onChange={(e) => updateLink("website", e.target.value)}
              placeholder="https://yourname.dev"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Twitter / X
            <input
              className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
              value={profile.links.twitter ?? ""}
              onChange={(e) => updateLink("twitter", e.target.value)}
              placeholder="https://twitter.com/yourname"
            />
          </label>
        </div>
      </section>

      {/* Experience */}
      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Experience</h2>
          <Button
            type="button"
            variant="ghost"
            className="text-xs"
            onClick={addExperience}
          >
            + Add experience
          </Button>
        </div>
        {profile.experiences.length === 0 && (
          <p className="text-xs text-slate-400">
            Add your current job and a few past roles. Mark your current role
            with “Currently here” so dates stay dynamic.
          </p>
        )}
        <div className="space-y-4">
          {profile.experiences.map((exp, index) => (
            <div
              key={index}
              className="space-y-2 rounded-lg border border-slate-800/80 bg-slate-950/90 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-200">
                  Experience #{index + 1}
                </p>
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-red-300"
                  onClick={() => removeExperience(index)}
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs">
                  Company
                  <input
                    className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
                    value={exp.company}
                    onChange={(e) =>
                      updateExperience(index, { company: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Title
                  <input
                    className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
                    value={exp.title}
                    onChange={(e) =>
                      updateExperience(index, { title: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs">
                  Location
                  <input
                    className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
                    value={exp.location ?? ""}
                    onChange={(e) =>
                      updateExperience(index, { location: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Start date
                  <input
                    type="date"
                    className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
                    value={exp.startDate}
                    onChange={(e) =>
                      updateExperience(index, { startDate: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  {exp.isCurrent ? "End date (disabled)" : "End date"}
                  <input
                    type="date"
                    disabled={exp.isCurrent}
                    className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500 disabled:opacity-50"
                    value={exp.endDate ?? ""}
                    onChange={(e) =>
                      updateExperience(index, {
                        endDate: e.target.value || null,
                      })
                    }
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={exp.isCurrent}
                  onChange={(e) =>
                    updateExperience(index, {
                      isCurrent: e.target.checked,
                      endDate: e.target.checked ? null : exp.endDate,
                    })
                  }
                />
                Currently here (show “Present” on your resume)
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Description
                <textarea
                  className="min-h-[60px] rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
                  value={exp.description ?? ""}
                  onChange={(e) =>
                    updateExperience(index, { description: e.target.value })
                  }
                  placeholder="What did you build, ship or own?"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Projects</h2>
          <Button
            type="button"
            variant="ghost"
            className="text-xs"
            onClick={addProject}
          >
            + Add project
          </Button>
        </div>
        <div className="space-y-4">
          {profile.projects.map((proj, index) => (
            <div
              key={index}
              className="space-y-2 rounded-lg border border-slate-800/80 bg-slate-950/90 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-200">
                  Project #{index + 1}
                </p>
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-red-300"
                  onClick={() => removeProject(index)}
                >
                  Remove
                </button>
              </div>
              <label className="flex flex-col gap-1 text-xs">
                Name
                <input
                  className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
                  value={proj.name}
                  onChange={(e) =>
                    updateProject(index, { name: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Description
                <textarea
                  className="min-h-[60px] rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
                  value={proj.description ?? ""}
                  onChange={(e) =>
                    updateProject(index, { description: e.target.value })
                  }
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs">
                  URL
                  <input
                    className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
                    value={proj.url ?? ""}
                    onChange={(e) =>
                      updateProject(index, { url: e.target.value })
                    }
                    placeholder="https://github.com/you/project"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Tech stack
                  <input
                    className="rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
                    value={proj.techStack ?? ""}
                    onChange={(e) =>
                      updateProject(index, { techStack: e.target.value })
                    }
                    placeholder="TypeScript · Next.js · Prisma"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={!!proj.highlight}
                  onChange={(e) =>
                    updateProject(index, { highlight: e.target.checked })
                  }
                />
                Highlight this project
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Skills</h2>
          <Button
            type="button"
            variant="ghost"
            className="text-xs"
            onClick={addSkill}
          >
            + Add skill
          </Button>
        </div>
        <div className="space-y-2">
          {profile.skills.map((skill, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/90 p-2"
            >
              <input
                className="flex-1 rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
                placeholder="Skill (e.g. TypeScript)"
                value={skill.name}
                onChange={(e) =>
                  updateSkill(index, { name: e.target.value })
                }
              />
              <input
                className="w-32 rounded-md border border-slate-700 bg-bg px-2 py-1 text-xs outline-none focus:border-sky-500"
                placeholder="Level (e.g. Advanced)"
                value={skill.level ?? ""}
                onChange={(e) =>
                  updateSkill(index, { level: e.target.value })
                }
              />
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-red-300"
                onClick={() => removeSkill(index)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save & update public profile"}
        </Button>
      </div>
    </div>
  );
}
