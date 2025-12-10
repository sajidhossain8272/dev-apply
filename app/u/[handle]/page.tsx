/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: { handle: string };
};

function formatRange(start: Date, end: Date | null): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  const startStr = fmt(start);
  const endStr = end ? fmt(end) : "Present";
  return `${startStr} – ${endStr}`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = params;

  const user = await prisma.user.findUnique({
    where: { handle },
    include: {
      profile: {
        include: {
          experiences: true,
          projects: true,
          skills: true,
        },
      },
    },
  });

  if (!user?.profile || !user.profile.isPublic) {
    return {
      title: "Developer not found",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    title: `${user.name ?? handle} – Developer Portfolio`,
    description:
      user.profile.headline ??
      user.profile.bio ??
      "Developer portfolio and ATS-friendly resume.",
    openGraph: {
      title: `${user.name ?? handle} – Developer Portfolio`,
      description:
        user.profile.headline ??
        user.profile.bio ??
        "Developer portfolio and ATS-friendly resume.",
      url: `${baseUrl}/u/${handle}`,
      type: "profile",
    },
    alternates: {
      canonical: `${baseUrl}/u/${handle}`,
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { handle } = params;

  const user = await prisma.user.findUnique({
    where: { handle },
    include: {
      profile: {
        include: {
          experiences: {
            orderBy: { startDate: "desc" },
          },
          projects: {
            orderBy: { createdAt: "desc" },
          },
          skills: true,
        },
      },
      settings: true,
    },
  });

  if (!user?.profile || !user.profile.isPublic) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Profile not found</h1>
        <p className="text-sm text-slate-300">
          This developer profile is not available.
        </p>
      </div>
    );
  }

  const p = user.profile;

  return (
    <article className="mx-auto max-w-3xl rounded-2xl border border-slate-800/80 bg-slate-950/70 p-6">
      {/* Header */}
      <header className="border-b border-slate-800/80 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {user.name ?? handle}
        </h1>
        {p.headline && (
          <p className="mt-1 text-sm text-slate-300">{p.headline}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          {p.location && <span>{p.location}</span>}
          {user.settings?.availability === "OPEN" && (
            <span className="rounded-full border border-emerald-500/60 bg-emerald-950/40 px-2 py-0.5 text-emerald-300">
              Open to work
            </span>
          )}
          {user.settings?.availability === "BUSY" && (
            <span className="rounded-full border border-amber-500/60 bg-amber-950/40 px-2 py-0.5 text-amber-300">
              Busy, open to offers
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-sky-300">
          {p.githubUrl && (
            <a href={p.githubUrl} target="_blank" rel="noreferrer">
              GitHub
            </a>
          )}
          {p.linkedinUrl && (
            <a href={p.linkedinUrl} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          )}
          {p.websiteUrl && (
            <a href={p.websiteUrl} target="_blank" rel="noreferrer">
              Website
            </a>
          )}
          {p.twitterUrl && (
            <a href={p.twitterUrl} target="_blank" rel="noreferrer">
              Twitter
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {p.bio && (
        <section className="mt-4 border-b border-slate-800/80 pb-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Summary
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-200">
            {p.bio}
          </p>
        </section>
      )}

      {/* Experience */}
      {p.experiences.length > 0 && (
        <section className="mt-4 border-b border-slate-800/80 pb-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Experience
          </h2>
          <div className="mt-2 space-y-3">
            {p.experiences.map((exp:any) => (
              <div key={exp.id} className="text-xs text-slate-200">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {exp.title} · {exp.company}
                    </p>
                    {exp.location && (
                      <p className="text-slate-400">{exp.location}</p>
                    )}
                  </div>
                  <p className="text-slate-400">
                    {formatRange(exp.startDate, exp.endDate)}
                  </p>
                </div>
                {exp.description && (
                  <p className="mt-1 whitespace-pre-line text-slate-200">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {p.projects.length > 0 && (
        <section className="mt-4 border-b border-slate-800/80 pb-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Projects
          </h2>
          <div className="mt-2 space-y-3">
            {p.projects.map((proj:any) => (
              <div key={proj.id} className="text-xs text-slate-200">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-semibold">{proj.name}</p>
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-300"
                    >
                      View
                    </a>
                  )}
                </div>
                {proj.techStack && (
                  <p className="text-slate-400">{proj.techStack}</p>
                )}
                {proj.description && (
                  <p className="mt-1 whitespace-pre-line text-slate-200">
                    {proj.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {p.skills.length > 0 && (
        <section className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Skills
          </h2>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-100">
            {p.skills.map((s:any) => (
              <span
                key={s.id}
                className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5"
              >
                {s.name}
                {s.level ? ` · ${s.level}` : ""}
              </span>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
