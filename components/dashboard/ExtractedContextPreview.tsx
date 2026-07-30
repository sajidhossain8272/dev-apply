/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";

interface ExtractedContextData {
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  email?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  skills?: { category?: string; items?: string[] }[];
  services?: { title?: string; description?: string }[];
  experiences?: {
    company?: string;
    title?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }[];
  projects?: {
    name?: string;
    description?: string;
    url?: string;
    techStack?: string;
  }[];
}

/* ---------- Inline SVG Icons ---------- */

const IconLocation = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconEmail = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IconLink = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const IconBriefcase = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 11c-3.232 0-6.231.678-9 1.892M7 21h4a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2zM21 7.5V18a2 2 0 01-2 2H10a2 2 0 01-2-2V7.5M21 7.5l-6.5-4.5a2 2 0 00-2.5 0L5.5 7.5" />
  </svg>
);

const IconFolder = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const IconWrench = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l-2.496 3.5a4 4 0 11-5.656-5.656l3.5-2.496m4.828 4.828L19.8 7.962a4 4 0 00-5.656-5.656l-7.222 7.222m4.828 4.828l-4.828-4.828m4.828 4.828L19.8 7.962" />
  </svg>
);

const IconCode = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const IconChevron = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

/* ---------- Helper: Stat Badge ---------- */

function StatBadge({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      {count} {label}
    </span>
  );
}

/* ---------- Helper: Section Header ---------- */

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-emerald-400">{icon}</span>
      <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
        {title}
      </h4>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] text-neutral-500">({count})</span>
      )}
    </div>
  );
}

/* ---------- Main Component ---------- */

export function ExtractedContextPreview({ data }: { data: any }) {
  const [expanded, setExpanded] = useState(true);

  if (!data) return null;

  const ctx: ExtractedContextData = data;
  const skills = Array.isArray(ctx.skills) ? ctx.skills : [];
  const services = Array.isArray(ctx.services) ? ctx.services : [];
  const experiences = Array.isArray(ctx.experiences) ? ctx.experiences : [];
  const projects = Array.isArray(ctx.projects) ? ctx.projects : [];

  const totalSkills = skills.reduce((sum, s) => sum + (s.items?.length || 0), 0);
  const hasProfile =
    ctx.name || ctx.headline || ctx.bio || ctx.location || ctx.email;
  const hasLinks =
    ctx.githubUrl || ctx.linkedinUrl || ctx.websiteUrl;

  // Count non-empty sections
  const sectionCount = [
    hasProfile,
    skills.length > 0,
    services.length > 0,
    experiences.length > 0,
    projects.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="bg-neutral-900/80 border border-emerald-500/30 rounded-xl overflow-hidden">
      {/* Header / Summary Bar */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-neutral-900 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AI Extracted Context Preview
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatBadge label="Skills" count={totalSkills} />
            <StatBadge label="Services" count={services.length} />
            <StatBadge label="Projects" count={projects.length} />
            <StatBadge label="Exp." count={experiences.length} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-neutral-500 hidden sm:inline">
            {sectionCount} sections extracted
          </span>
          <IconChevron open={expanded} />
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-neutral-800 p-4 space-y-6">
          {/* Profile Section */}
          {hasProfile && (
            <div>
              <SectionHeader
                icon={<IconCode />}
                title="Profile"
              />
              <div className="space-y-2">
                {ctx.name && (
                  <div className="text-sm font-bold text-white">{ctx.name}</div>
                )}
                {ctx.headline && (
                  <div className="text-xs text-emerald-400 font-semibold">
                    {ctx.headline}
                  </div>
                )}
                {ctx.bio && (
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {ctx.bio}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
                  {ctx.location && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                      <IconLocation />
                      {ctx.location}
                    </span>
                  )}
                  {ctx.email && (
                    <a
                      href={`mailto:${ctx.email}`}
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors"
                    >
                      <IconEmail />
                      {ctx.email}
                    </a>
                  )}
                </div>
                {hasLinks && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
                    {ctx.githubUrl && (
                      <a
                        href={ctx.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors"
                      >
                        <IconLink />
                        GitHub
                      </a>
                    )}
                    {ctx.linkedinUrl && (
                      <a
                        href={ctx.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors"
                      >
                        <IconLink />
                        LinkedIn
                      </a>
                    )}
                    {ctx.websiteUrl && (
                      <a
                        href={ctx.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors"
                      >
                        <IconLink />
                        Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills Section */}
          {skills.length > 0 && (
            <div>
              <SectionHeader
                icon={<IconCode />}
                title="Skills"
                count={skills.length}
              />
              <div className="space-y-2">
                {skills.map((skill, i) => (
                  <div key={i} className="space-y-1">
                    {skill.category && (
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        {skill.category}
                      </span>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {skill.items?.map((item, j) => (
                        <span
                          key={j}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services Section */}
          {services.length > 0 && (
            <div>
              <SectionHeader
                icon={<IconWrench />}
                title="Services"
                count={services.length}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map((s, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-0.5"
                  >
                    {s.title && (
                      <div className="text-xs font-bold text-neutral-200">
                        {s.title}
                      </div>
                    )}
                    {s.description && (
                      <div className="text-[11px] text-neutral-400 leading-relaxed">
                        {s.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience Section */}
          {experiences.length > 0 && (
            <div>
              <SectionHeader
                icon={<IconBriefcase />}
                title="Experience"
                count={experiences.length}
              />
              <div className="space-y-3">
                {experiences.map((exp, i) => (
                  <div
                    key={i}
                    className="relative pl-4 border-l border-neutral-700 space-y-0.5"
                  >
                    <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      {exp.title && (
                        <span className="text-xs font-bold text-white">
                          {exp.title}
                        </span>
                      )}
                      {exp.company && (
                        <span className="text-xs text-emerald-400">
                          @ {exp.company}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-neutral-500">
                      {(exp.startDate || exp.endDate) && (
                        <span>
                          {exp.startDate || ""}
                          {exp.startDate && exp.endDate ? " – " : ""}
                          {exp.endDate || ""}
                        </span>
                      )}
                      {exp.location && (
                        <>
                          <span>•</span>
                          <span>{exp.location}</span>
                        </>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-[11px] text-neutral-400 leading-relaxed pt-0.5">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <div>
              <SectionHeader
                icon={<IconFolder />}
                title="Projects"
                count={projects.length}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {projects.map((p, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {p.name && (
                        <span className="text-xs font-bold text-neutral-200 truncate">
                          {p.name}
                        </span>
                      )}
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-400 hover:underline shrink-0"
                        >
                          ↗
                        </a>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                    {p.techStack && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {p.techStack
                          .split(",")
                          .map((tech) => tech.trim())
                          .filter(Boolean)
                          .map((tech, j) => (
                            <span
                              key={j}
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700"
                            >
                              {tech}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback: No recognizable data */}
          {!hasProfile &&
            skills.length === 0 &&
            services.length === 0 &&
            experiences.length === 0 &&
            projects.length === 0 && (
              <div className="text-xs text-neutral-500 text-center py-4">
                No structured data was recognized in the extracted context.
                You can still proceed — the AI will use GitHub and questionnaire
                data.
              </div>
            )}
        </div>
      )}
    </div>
  );
}