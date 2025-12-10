/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

// We don't trust Next about params shape being sync/async, so we normalize it.
type PageProps = {
  params: any;
};

async function resolveHandle(params: any): Promise<string | undefined> {
  if (!params) return undefined;

  // Next 15/16 dynamic APIs: params can be a Promise
  if (typeof params.then === "function") {
    const resolved = await params;
    return resolved?.handle as string | undefined;
  }

  // Older / stable: params is already a plain object
  return params.handle as string | undefined;
}

async function getUserByHandle(handle: string) {
  return prisma.user.findUnique({
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
}

/* -------------------- SEO / OpenGraph -------------------- */

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const handle = await resolveHandle(props.params);

  // If we can’t resolve the handle at all, just return a generic title.
  if (!handle) {
    return {
      title: "Developer profile",
      description: "Developer profile.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { handle },
    include: { profile: true },
  });

  if (!user || !user.profile || !user.profile.isPublic) {
    return {
      title: "Developer not found",
      description: "This developer profile is not public or does not exist.",
    };
  }

  const title = `${user.name ?? handle} – Developer profile`;
  const description =
    user.profile.headline ??
    user.profile.bio ??
    "Developer profile and portfolio.";

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/u/${handle}`,
      type: "profile",
    },
  };
}

/* -------------------- Public profile page -------------------- */

export default async function PublicProfilePage(props: PageProps) {
  const handle = await resolveHandle(props.params);

  // If no handle, 404 immediately instead of calling Prisma with undefined
  if (!handle) {
    notFound();
  }

  const user = await getUserByHandle(handle);

  if (!user || !user.profile || !user.profile.isPublic) {
    notFound();
  }

  const { profile, settings } = user;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 py-10">
      {/* Header */}
      <section className="flex flex-col gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {user.name ?? handle}
          </h1>
          {profile.headline && (
            <p className="mt-1 text-sm text-slate-300">
              {profile.headline}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {profile.location && <span>{profile.location}</span>}
          {profile.currentRole && <span>• {profile.currentRole}</span>}
          {profile.currentCompany && <span>@ {profile.currentCompany}</span>}
          {settings?.availability && (
            <span className="rounded-full border border-emerald-500/50 px-2 py-0.5 text-[11px] text-emerald-300">
              {settings.availability === "OPEN"
                ? "Open to work"
                : settings.availability === "BUSY"
                ? "Busy"
                : "Not looking"}
            </span>
          )}
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
          {profile.githubUrl && (
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              GitHub
            </a>
          )}
          {profile.linkedinUrl && (
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              LinkedIn
            </a>
          )}
          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Website
            </a>
          )}
          {profile.twitterUrl && (
            <a
              href={profile.twitterUrl}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              X / Twitter
            </a>
          )}
        </div>
      </section>

      {/* About */}
      {profile.bio && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            About
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">
            {profile.bio}
          </p>
        </section>
      )}

      {/* Experience */}
      {profile.experiences.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Experience
          </h2>
          <div className="space-y-4">
            {profile.experiences.map((exp) => (
              <div key={exp.id} className="space-y-1 text-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium text-slate-100">
                    {exp.title}
                  </span>
                  <span className="text-slate-300">@ {exp.company}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {exp.location && <span>{exp.location} • </span>}
                  <span>
                    {exp.startDate.toLocaleDateString()} –{" "}
                    {exp.isCurrent
                      ? "Present"
                      : exp.endDate?.toLocaleDateString() ?? "End"}
                  </span>
                </div>
                {exp.description && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {profile.projects.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Projects
          </h2>
          <div className="space-y-4">
            {profile.projects.map((proj) => (
              <div key={proj.id} className="space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-100">
                    {proj.name}
                  </span>
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-sky-400 underline-offset-4 hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs leading-relaxed text-slate-300">
                    {proj.description}
                  </p>
                )}
                {proj.techStack && (
                  <p className="text-[11px] text-slate-400">
                    {proj.techStack}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {profile.skills.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill.id}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
