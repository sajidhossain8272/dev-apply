export const SAJID_HANDLE = "sajidhossain8272";

export function isSajidAccount(user: { handle?: string | null; email?: string | null; name?: string | null } | null | undefined) {
  return Boolean(
    user?.handle?.toLowerCase() === SAJID_HANDLE ||
      user?.email?.toLowerCase().includes(SAJID_HANDLE) ||
      user?.name?.toLowerCase() === "sajid hossain"
  );
}

export const SAJID_BASE_RESUME = {
  name: "Sajid Hossain",
  headline: "Full-Stack Web Developer | AI Application & Automation Engineer",
  contact: {
    email: "sajidhossain8272@gmail.com",
    phone: "+8801329530468",
    location: "Dhaka, Bangladesh",
    linkedin: "https://linkedin.com/in/brokephilanthropist",
    github: "https://github.com/sajidhossain8272",
    website: "https://sajidev-p.vercel.app",
  },
  summary: "Full-Stack Web Developer and AI Application Engineer building production web products, automation workflows, and developer tools with React, Next.js, Node.js, TypeScript, and AI APIs. Experienced across product discovery, implementation, testing, deployment, and continuous improvement.",
  skills: [
    { category: "Frontend", items: ["React.js", "Next.js", "TypeScript", "JavaScript", "HTML5", "CSS3", "Tailwind CSS", "Accessibility", "SEO"] },
    { category: "Backend & Data", items: ["Node.js", "Express.js", "REST APIs", "GraphQL", "MongoDB", "Prisma", "Firebase"] },
    { category: "AI & Automation", items: ["Google AI Studio APIs", "LLM integration", "Prompt engineering", "n8n", "Workflow automation"] },
    { category: "Cloud & Quality", items: ["Docker", "GitHub Actions", "AWS", "GCP", "Jest", "React Testing Library", "Git"] },
  ],
  experiences: [
    { company: "Panorama Management Advisory Services", title: "Software Developer", location: "Dhaka, Bangladesh", startDate: "Oct 2024", endDate: "Mar 2026", bullets: ["Co-built an AI-assisted assessment reporting system with Next.js, Node.js, and Google AI Studio APIs, reducing report turnaround from days to 1-2 hours.", "Built React and TypeScript form workflows, n8n data pipelines, Docker deployments, GitHub Actions CI/CD, and Jest/React Testing Library coverage.", "Optimized MongoDB queries and Prisma schemas for client-facing modules."] },
    { company: "Panorama Management Advisory Services", title: "Software Associate", location: "Dhaka, Bangladesh", startDate: "Mar 2024", endDate: "Oct 2024", bullets: ["Performed manual and component QA, contributing to a 30% reduction in post-release bug reports.", "Authored SOPs and API documentation and used GTmetrix and Google Analytics to improve performance and accessibility."] },
    { company: "Independent Freelance / Product Work", title: "Freelance Developer & Growth Consultant", location: "Remote", startDate: "2014", endDate: "Present", isCurrent: true, bullets: ["Delivered web, automation, SEO, analytics, and paid-growth work for international clients; source history includes Meta Ads, Google Ads, GA4, SEO, CRO, and workflow automation."] },
  ],
  projects: [
    { name: "Plzwork / Quick Convert", subtitle: "Privacy-first browser file conversion", techStack: "Next.js, React, TypeScript, Canvas/File APIs", liveUrl: "https://plzwork.app", repoUrl: "https://github.com/sajidhossain8272/plzwork", bullets: ["Built bulk image conversion in the browser so sensitive files do not need to be uploaded."] },
    { name: "GrafiXr", subtitle: "Production digital portfolio platform", techStack: "Next.js, Express.js, MongoDB, Cloudinary", liveUrl: "https://www.grafixr.com/", repoUrl: "https://github.com/sajidhossain8272/Grafixr-production", bullets: ["Built the full-stack platform and admin portal with media optimization and SEO-focused presentation."] },
    { name: "QUULIX", subtitle: "Full-stack e-commerce platform", techStack: "Next.js, Node.js, GraphQL, Prisma, MongoDB, Docker", liveUrl: "https://quulix.vercel.app/", repoUrl: "https://github.com/sajidhossain8272/Quulix", bullets: ["Implemented catalog, filtering, user workflows, data modeling, and CI/CD automation."] },
    { name: "AgentBroko", subtitle: "Independent AI engineering and product project", techStack: "LLM workflows, APIs, persistent state, scheduling", repoUrl: "https://github.com/sajidhossain8272", bullets: ["Designed repeatable agent workflows, decision journaling, research automation, and persistent state concepts."] },
    { name: "notepad-os", subtitle: "Offline-first Markdown editor", techStack: "React, TypeScript, browser storage", repoUrl: "https://github.com/sajidhossain8272/notepad-os", bullets: ["Built a private local-first editor with instant state persistence."] },
  ],
  education: [{ degree: "BSc in Computer Science & Engineering", institution: "Northern University Bangladesh", year: "2021 - 2024" }],
  additional: { languages: "English (Fluent), Bangla (Native), Hindi (Conversational)", focusAreas: "AI applications, automation, full-stack architecture, developer tools, growth systems" },
};
