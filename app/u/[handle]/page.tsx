/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/SiteHeader";
export const dynamic = "force-dynamic";

// We don't trust Next about params shape being sync/async, so we normalize it.
type PageProps = {
  params: any;
};

async function resolveHandle(params: any): Promise<string | undefined> {
  if (!params) return undefined;
  if (typeof params.then === "function") {
    const resolved = await params;
    return resolved?.handle as string | undefined;
  }
  return params.handle as string | undefined;
}

async function getUserByHandle(handle: string) {
  return prisma.user.findUnique({
    where: { handle },
    include: {
      profile: {
        include: {
          experiences: { orderBy: { startDate: "desc" } },
          projects: { orderBy: { createdAt: "desc" } },
          skills: true,
        },
      },
      settings: true,
    },
  });
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const handle = await resolveHandle(props.params);
  if (!handle) return { title: "Developer Profile" };

  const user = await prisma.user.findUnique({
    where: { handle },
    include: { profile: true },
  });

  if (!user || !user.profile || !user.profile.isPublic) {
    return { title: "Profile Not Found" };
  }

  const title = `${user.name ?? handle} — Portfolio`;
  return {
    title,
    description: user.profile.headline ?? user.profile.bio ?? "Developer portfolio.",
  };
}

export default async function PublicProfilePage(props: PageProps) {
  const handle = await resolveHandle(props.params);
  if (!handle) notFound();

  const user = await getUserByHandle(handle);
  if (!user || !user.profile || !user.profile.isPublic) notFound();

  const { profile, settings } = user;
  const theme = (settings as any)?.theme ?? "dark";

  return (
    <div data-theme={theme} className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] transition-colors duration-300">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-24 sm:px-12">
        {/* Meta/Nav Placeholder for ATS - Hidden from view but present for parsers */}
        <nav className="sr-only">
          <a href="#about">About</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a href="#skills">Skills</a>
        </nav>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <header className="space-y-6 border-b border-neutral-800 pb-12">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl uppercase text-[var(--fg)]">
                {user.name ?? handle}
              </h1>
              {profile.headline && (
                <p className="text-lg font-medium text-[var(--muted)] sm:text-xl">
                  {profile.headline}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              {profile.location && <span>{profile.location}</span>}
              {profile.currentRole && <span>{profile.currentRole}</span>}
              {profile.currentCompany && <span>@ {profile.currentCompany}</span>}
              {settings?.availability === "OPEN" && (
                <span className="text-[var(--fg)] border border-[var(--fg)]/20 px-2 py-1">Available for new opportunities</span>
              )}
            </div>

            <div className="flex flex-wrap gap-6 pt-4 text-xs font-bold uppercase tracking-widest hover:text-[var(--fg)] transition-colors text-[var(--muted)]">
              {profile.githubUrl && <a href={profile.githubUrl} target="_blank" className="no-underline hover:underline">GitHub</a>}
              {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" className="no-underline hover:underline">LinkedIn</a>}
              {profile.websiteUrl && <a href={profile.websiteUrl} target="_blank" className="no-underline hover:underline">Portfolio</a>}
              {profile.twitterUrl && <a href={profile.twitterUrl} target="_blank" className="no-underline hover:underline">X / Twitter</a>}
            </div>
          </header>

          <div className="grid grid-cols-1 gap-16 pt-16 lg:grid-cols-[200px_1fr]">
            {/* About Section */}
            <aside className="space-y-2">
              <h2 id="about" className="text-xs font-black uppercase tracking-[0.3em] text-[var(--muted)]">About</h2>
            </aside>
            <div className="space-y-6">
              <p className="text-xl leading-relaxed text-[var(--muted)] group-hover:text-[var(--fg)] transition-colors">
                {profile.bio || "No biography provided."}
              </p>
            </div>

            {/* Services Offered Section */}
            {(profile as any).services && Array.isArray((profile as any).services) && (profile as any).services.length > 0 && (
              <>
                <aside className="space-y-2">
                  <h2 id="services" className="text-xs font-black uppercase tracking-[0.3em] text-[var(--muted)]">Services</h2>
                </aside>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {((profile as any).services as any[]).map((srv, idx) => (
                    <div key={idx} className="border border-[var(--border)] p-6 bg-[var(--surface)] space-y-2">
                      <h3 className="text-base font-bold text-[var(--fg)]">{srv.title}</h3>
                      <p className="text-xs leading-relaxed text-[var(--muted)]">{srv.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Custom Sections / Highlights */}
            {(profile as any).customSections && Array.isArray((profile as any).customSections) && (profile as any).customSections.length > 0 && (
              <>
                {((profile as any).customSections as any[]).map((sec, idx) => (
                  <React.Fragment key={idx}>
                    <aside className="space-y-2">
                      <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--muted)]">{sec.title || "Highlights"}</h2>
                    </aside>
                    <div className="space-y-4">
                      <p className="text-base leading-relaxed text-[var(--muted)]">{sec.content}</p>
                    </div>
                  </React.Fragment>
                ))}
              </>
            )}

            {/* Experience Section */}
            {profile.experiences.length > 0 && (
              <>
                <aside className="space-y-2">
                  <h2 id="experience" className="text-xs font-black uppercase tracking-[0.3em] text-[var(--muted)]">Experience</h2>
                </aside>
                <div className="space-y-12">
                  {profile.experiences.map((exp) => (
                    <article key={exp.id} className="group space-y-4">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
                        <h3 className="text-2xl font-bold group-hover:text-[var(--fg)] transition-colors text-[var(--fg)]">
                          {exp.title} <span className="text-[var(--muted)] font-medium">@ {exp.company}</span>
                        </h3>
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                          {exp.startDate.getFullYear()} — {exp.isCurrent ? "Present" : exp.endDate?.getFullYear()}
                        </span>
                      </div>
                      <p className="max-w-2xl text-[var(--muted)] transition-colors group-hover:text-[var(--fg)]">
                        {exp.description}
                      </p>
                    </article>
                  ))}
                </div>
              </>
            )}

            {/* Projects Section */}
            {profile.projects.length > 0 && (
              <>
                <aside className="space-y-2">
                  <h2 id="projects" className="text-xs font-black uppercase tracking-[0.3em] text-[var(--muted)]">Projects</h2>
                </aside>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  {profile.projects.map((proj) => (
                    <article key={proj.id} className="group relative border border-[var(--border)] p-8 hover:border-[var(--fg)] transition-all duration-500 bg-[var(--surface)]">
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-[var(--fg)] text-[var(--fg)]">
                          {proj.name}
                        </h3>
                        <p className="text-sm leading-relaxed text-[var(--muted)] group-hover:text-[var(--fg)]">
                          {proj.description}
                        </p>
                        {proj.techStack && (
                          <div className="pt-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                            {proj.techStack}
                          </div>
                        )}
                        {proj.url && (
                          <a href={proj.url} target="_blank" className="absolute inset-0 z-10 opacity-0">View Project</a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {/* Skills Section */}
            {profile.skills.length > 0 && (
              <>
                <aside className="space-y-2">
                  <h2 id="skills" className="text-xs font-black uppercase tracking-[0.3em] text-[var(--muted)]">Skills</h2>
                </aside>
                <div className="flex flex-wrap gap-x-12 gap-y-6">
                  {profile.skills.map((skill) => (
                    <div key={skill.id} className="space-y-1">
                      <div className="text-lg font-bold text-[var(--fg)]">{skill.name}</div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-[var(--muted)]">
                        {skill.level || "Proficient"}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <footer className="mt-32 pt-12 border-t border-[var(--border)] text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--muted)] text-center">
          Generated by dev-apply • {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}
