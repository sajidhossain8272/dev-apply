/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "./prisma";
import { isSajidAccount, SAJID_BASE_RESUME } from "./sajid-profile";
import { ResumeData } from "@/components/resume/ResumeView";

/**
 * Fetch and construct the canonical, comprehensive candidate profile from DB
 * combining Profile, Experiences, Projects, Active GitHub Repositories, Skills, and Resume Studio data.
 */
export async function getCandidateComprehensiveData(userId: string): Promise<{
  candidateName: string;
  baseResume: ResumeData;
  profile: any;
  repositories: Array<{
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    language: string | null;
    stars: number;
    topics: string[];
    isFork: boolean;
  }>;
  isSajid: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          experiences: true,
          projects: true,
          skills: true,
        },
      },
      repositories: {
        where: { isFork: false },
        orderBy: [{ stars: "desc" }, { lastPushedAt: "desc" }],
        take: 30,
      },
      resumes: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  const isSajid = isSajidAccount(user);

  // 1. Try to use user's latest Resume Studio resume
  const existingResume = user?.resumes?.[0]?.content as ResumeData | undefined;

  // 2. Extract repositories
  const repositories = (user?.repositories || []).map((r) => ({
    name: r.name,
    fullName: r.fullName,
    description: r.description,
    url: r.url,
    language: r.language,
    stars: r.stars,
    topics: r.topics || [],
    isFork: r.isFork,
  }));

  // 3. Construct unified base resume adhering to Resume Studio format
  let baseResume: ResumeData;

  if (existingResume && existingResume.name && existingResume.experiences) {
    baseResume = existingResume;
  } else if (isSajid) {
    baseResume = { ...SAJID_BASE_RESUME };
  } else {
    // Construct dynamic resume from profile + experiences + skills + repositories
    const prof = user?.profile;
    const skillsGrouped: { category: string; items: string[] }[] = [];

    if (prof?.skills && prof.skills.length > 0) {
      skillsGrouped.push({
        category: "Core Skills",
        items: prof.skills.map((s) => s.name),
      });
    }

    const experiencesFormatted = (prof?.experiences || []).map((exp: any) => ({
      company: exp.company,
      title: exp.title,
      location: exp.location || undefined,
      startDate: exp.startDate ? new Date(exp.startDate).getFullYear().toString() : undefined,
      endDate: exp.endDate ? new Date(exp.endDate).getFullYear().toString() : undefined,
      isCurrent: exp.isCurrent,
      bullets: (exp.bullets as string[]) || (exp.description ? [exp.description] : []),
    }));

    const projectsFormatted = (prof?.projects || []).map((p: any) => ({
      name: p.name,
      subtitle: p.description || undefined,
      repoUrl: p.url || undefined,
      liveUrl: p.url || undefined,
      techStack: p.techStack || undefined,
      bullets: (p.bullets as string[]) || (p.description ? [p.description] : []),
    }));

    // If no manual projects, populate with top active GitHub repos
    if (projectsFormatted.length === 0 && repositories.length > 0) {
      for (const repo of repositories.slice(0, 5)) {
        projectsFormatted.push({
          name: repo.name,
          subtitle: repo.description || `${repo.language || "Software"} project`,
          repoUrl: repo.url,
          liveUrl: repo.url,
          techStack: repo.language || undefined,
          bullets: [
            repo.description || `Developed open-source repository utilizing ${repo.language || "modern development practices"}.`,
          ],
        });
      }
    }

    baseResume = {
      name: user?.name || "Candidate",
      headline: prof?.headline || "Software Engineer",
      contact: {
        email: user?.email || "",
        phone: user?.phone || "",
        location: prof?.location || "",
        github: prof?.githubUrl || (user?.githubUsername ? `https://github.com/${user.githubUsername}` : ""),
        linkedin: prof?.linkedinUrl || "",
        website: prof?.websiteUrl || "",
      },
      summary: prof?.bio || "Experienced software engineer with a track record of building production applications.",
      skills: skillsGrouped.length > 0 ? skillsGrouped : [{ category: "Technologies", items: ["JavaScript", "TypeScript", "Node.js", "React"] }],
      experiences: experiencesFormatted,
      projects: projectsFormatted,
      education: [],
      additional: {},
    };
  }

  const candidateName = baseResume.name || user?.name || "Candidate";

  return {
    candidateName,
    baseResume,
    profile: user?.profile,
    repositories,
    isSajid,
  };
}
