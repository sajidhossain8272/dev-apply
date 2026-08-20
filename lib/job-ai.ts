/* eslint-disable @typescript-eslint/no-explicit-any */

import { callGeminiApi } from "./gemini";
import { ResumeData } from "@/components/resume/ResumeView";

/**
 * Calculate a match score (0-100) between a resume, active repos, and a job description.
 * Returns the score plus detailed reasons for matched/missing skills.
 */
export async function calculateMatchScore(params: {
  resumeContent: any;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  customInstructions?: string;
  activeRepositories?: any[];
}): Promise<{
  score: number;
  reasons: { reason: string; matched: boolean; category: string }[];
  summary: string;
}> {
  const { resumeContent, jobDescription, jobTitle, company, customInstructions, activeRepositories } = params;

  const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer and technical hiring manager.

Job Details:
- Title: ${jobTitle || "Not specified"}
- Company: ${company || "Not specified"}
- Job Description:
${jobDescription.slice(0, 7000)}

${customInstructions ? `User Custom Instructions & Focus:\n${customInstructions}\n` : ""}

Candidate Profile & Resume (JSON):
${JSON.stringify(resumeContent).slice(0, 6000)}

${activeRepositories && activeRepositories.length > 0 ? `Candidate Active GitHub Repositories:\n${JSON.stringify(activeRepositories.slice(0, 15))}` : ""}

Task:
Analyze how well the candidate's resume and real technical portfolio matches the job description. Consider:
1. Required skills match (languages, frameworks, libraries, tools)
2. Experience and project relevance (years, technical complexity, live/active repos)
3. Custom user instructions/focus areas (if provided)
4. Keywords and ATS alignment

Return ONLY a valid JSON object in this exact format:
{
  "score": 88,
  "summary": "Brief 1-2 sentence executive summary of the match quality and strongest alignment points.",
  "reasons": [
    { "reason": "Next.js & React.js - Required and demonstrated across core production projects", "matched": true, "category": "Skills" },
    { "reason": "PostgreSQL & Prisma - Required and present in active repositories", "matched": true, "category": "Skills" },
    { "reason": "AWS / Kubernetes - Mentioned in JD as nice-to-have", "matched": false, "category": "Infrastructure" }
  ]
}

The score should be 0-100 where:
- 90-100: Excellent match
- 75-89: Strong match
- 60-74: Fair match
- Below 60: Poor match
`.trim();

  const rawJson = await callGeminiApi(prompt, "extraction", true);
  try {
    const result = JSON.parse(rawJson);
    return {
      score: Math.min(100, Math.max(0, result.score || 0)),
      reasons: result.reasons || [],
      summary: result.summary || "",
    };
  } catch (err) {
    console.error("Failed to parse match score JSON:", rawJson);
    return {
      score: 75,
      reasons: [],
      summary: "Evaluated profile against job requirements.",
    };
  }
}

/**
 * Polish and optimize a resume for a specific job description and user custom instructions
 * using the unified Resume Studio core architecture and real active repositories.
 */
export async function polishResumeForJob(params: {
  resumeContent: any;
  jobDescription: string;
  matchReasons?: any[];
  jobTitle?: string;
  company?: string;
  customInstructions?: string;
  activeRepositories?: any[];
}): Promise<{
  content: ResumeData;
  polishNotes: string;
  polishSummary: string;
}> {
  const { resumeContent, jobDescription, matchReasons, jobTitle, company, customInstructions, activeRepositories } = params;

  const prompt = `
You are a Principal Tech Recruiter and Executive Resume Writer.
Your mission is to produce a state-of-the-art tailored resume in the exact Resume Studio JSON format.

Target Role & Company:
- Target Title: ${jobTitle || "Software Engineer"}
- Target Company: ${company || "Target Organization"}

Job Description:
${jobDescription.slice(0, 8000)}

${customInstructions ? `CRITICAL USER CUSTOM INSTRUCTIONS (Apply these strictly):\n"${customInstructions}"\n` : ""}

Candidate Real Base Resume (JSON):
${JSON.stringify(resumeContent).slice(0, 8000)}

${activeRepositories && activeRepositories.length > 0 ? `Candidate Active GitHub Repositories (Use these real repos in projects section if relevant):\n${JSON.stringify(activeRepositories.slice(0, 20))}` : ""}

${matchReasons ? `Identified Match Opportunities:\n${JSON.stringify(matchReasons)}` : ""}

Instructions:
1. STANDARD RESUME STUDIO ARCHITECTURE: Output MUST strictly adhere to the Resume Studio JSON structure below.
2. GROUNDED & TRUTHFUL: Do NOT fabricate imaginary companies or fake work history. Use the candidate's real experiences, real projects, real active GitHub repos, and real skills.
3. TAILOR WITH JD KEYWORDS & IMPACT:
   - Refine professional summary to directly address the target role and company.
   - Organize and categorize skills (e.g. "Frontend", "Backend & APIs", "Databases & Cloud", "Tools") emphasizing technologies required by the JD.
   - Refine experience bullet points to emphasize quantifiable achievements, metrics, technical decisions, and JD-relevant responsibilities.
   - In the "projects" section, select and showcase 3-5 of the candidate's best real projects/GitHub repositories that directly demonstrate mastery over technologies the JD asks for.
4. INCORPORATE USER CUSTOM INSTRUCTIONS: If custom instructions were provided, prioritize them (e.g. emphasizing specific technologies, framing, or tone).

Return ONLY a valid JSON object in this exact format:
{
  "content": {
    "name": "${resumeContent?.name || 'Candidate'}",
    "headline": "Targeted Professional Headline for this Role",
    "contact": {
      "email": "${resumeContent?.contact?.email || ''}",
      "phone": "${resumeContent?.contact?.phone || ''}",
      "location": "${resumeContent?.contact?.location || ''}",
      "linkedin": "${resumeContent?.contact?.linkedin || ''}",
      "github": "${resumeContent?.contact?.github || ''}",
      "website": "${resumeContent?.contact?.website || ''}"
    },
    "summary": "Impactful 3-4 sentence professional summary tailored to this position.",
    "skills": [
      { "category": "Core Technologies", "items": ["React.js", "Next.js", "TypeScript"] },
      { "category": "Backend & Cloud", "items": ["Node.js", "PostgreSQL", "Prisma", "Docker"] }
    ],
    "experiences": [
      {
        "company": "Company Name",
        "title": "Role Title",
        "location": "Location",
        "startDate": "Start Date",
        "endDate": "End Date",
        "isCurrent": false,
        "bullets": [
          "Action verb + quantifiable impact + relevant tech stack matching JD requirements",
          "Architected and deployed..."
        ]
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "subtitle": "Short descriptive subtitle",
        "liveUrl": "https://...",
        "repoUrl": "https://github.com/...",
        "techStack": "Next.js, TypeScript, PostgreSQL",
        "bullets": [
          "Key technical accomplishment and architectural highlight"
        ]
      }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "institution": "University / Institution",
        "year": "Graduation Year"
      }
    ],
    "additional": {
      "languages": "English (Fluent), ...",
      "focusAreas": "Full-stack web architecture, API design, DevOps"
    }
  },
  "polishNotes": "• Reorganized technical skills to highlight JD requirements\\n• Refined project bullets to showcase active GitHub repositories\\n• Aligned summary with target company focus",
  "polishSummary": "Optimized resume with ATS keywords, highlighted relevant active GitHub repositories, and tailored work experience."
}
`.trim();

  const rawJson = await callGeminiApi(prompt, "synthesis", true);
  try {
    const result = JSON.parse(rawJson);
    const content = result.content || resumeContent;

    // Ensure contact fields are preserved
    if (resumeContent?.contact) {
      content.contact = {
        ...resumeContent.contact,
        ...content.contact,
      };
    }
    if (!content.name && resumeContent?.name) {
      content.name = resumeContent.name;
    }

    return {
      content,
      polishNotes: result.polishNotes || "Tailored for job description requirements.",
      polishSummary: result.polishSummary || "Resume tailored with Resume Studio architecture.",
    };
  } catch (err) {
    console.error("Failed to parse polished resume JSON:", rawJson);
    return {
      content: resumeContent,
      polishNotes: "Standard profile used.",
      polishSummary: "Resume formatted.",
    };
  }
}

/**
 * Generate a compelling, tailored cover letter for a specific job application.
 */
export async function generateCoverLetterForJob(params: {
  resumeContent: any;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  customInstructions?: string;
  activeRepositories?: any[];
  matchReasons?: any[];
}): Promise<string> {
  const { resumeContent, jobDescription, jobTitle, company, customInstructions, activeRepositories, matchReasons } = params;

  const prompt = `
You are an expert executive cover letter writer.
Write a compelling, genuine, high-converting cover letter for this job application.

Target Job Details:
- Title: ${jobTitle || "Software Engineer"}
- Company: ${company || "Hiring Team"}
- Job Description:
${jobDescription.slice(0, 6000)}

${customInstructions ? `USER CUSTOM INSTRUCTIONS (Incorporate these directly):\n"${customInstructions}"\n` : ""}

Candidate Real Experience & Background:
- Name: ${resumeContent?.name || "The Candidate"}
- Headline: ${resumeContent?.headline || ""}
- Summary: ${resumeContent?.summary || ""}
- Skills: ${JSON.stringify(resumeContent?.skills || [])}
- Experiences: ${JSON.stringify(resumeContent?.experiences || []).slice(0, 3000)}

${activeRepositories && activeRepositories.length > 0 ? `Active GitHub Repositories:\n${JSON.stringify(activeRepositories.slice(0, 10))}` : ""}

${matchReasons ? `Key Match Strengths:\n${JSON.stringify(matchReasons)}` : ""}

Instructions:
1. Length: 250 - 380 words.
2. Tone: Confident, articulate, professional, and enthusiastic.
3. Salutation: "Dear ${company ? `${company} Hiring Team` : "Hiring Manager"},"
4. Highlight 2-3 specific real projects, active GitHub repositories, or past experiences that prove the candidate can hit the ground running on day 1 for this exact role.
5. Strictly adhere to any user custom instructions provided above.
6. Do NOT use bracketed placeholders like [Your Name] - use the candidate's actual name: "${resumeContent?.name || 'Sajid Hossain'}".
7. Return ONLY the final cover letter text.
`.trim();

  const text = await callGeminiApi(prompt, "synthesis", false);
  return text.trim();
}

/**
 * Generate the initial application email to send with the resume and cover letter attached.
 */
export async function generateApplicationEmail(params: {
  resumeContent: any;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  candidateName?: string;
  recipientEmail?: string;
}): Promise<{ subject: string; body: string }> {
  const { resumeContent, jobDescription, jobTitle, company, candidateName, recipientEmail } = params;

  const prompt = `
You are an expert at writing job application emails. Write a concise, professional email to accompany a job application.

Job Details:
- Title: ${jobTitle || "Not specified"}
- Company: ${company || "Not specified"}
- Job Description (excerpt):
${jobDescription.slice(0, 3000)}

Candidate Name: ${candidateName || resumeContent?.name || "The candidate"}

Instructions:
1. Write a brief, professional email (100-150 words).
2. The email should mention that the resume and cover letter are attached as PDF.
3. Express interest in the role and briefly mention 1-2 key qualifications.
4. Thank them for their time and express desire for an interview.
5. Sign off professionally with the candidate's name.
6. Do not use placeholders - use actual details from the resume.

Return ONLY a valid JSON object in this exact format:
{
  "subject": "Application for [Job Title] - [Candidate Name]",
  "body": "Dear Hiring Manager,\\n\\n...\\n\\nBest regards,\\n[Candidate Name]"
}
`.trim();

  const rawJson = await callGeminiApi(prompt, "questionnaire", true);
  try {
    const result = JSON.parse(rawJson);
    return {
      subject: result.subject || `Application for ${jobTitle || "Position"} - ${candidateName || ""}`,
      body: result.body || "",
    };
  } catch (err) {
    console.error("Failed to parse application email JSON:", rawJson);
    return {
      subject: `Application for ${jobTitle || "Position"} - ${candidateName || ""}`,
      body: `Dear Hiring Manager,\n\nI am writing to express my interest in the ${jobTitle || "position"} role at ${company || "your company"}. I have attached my resume and cover letter for your review.\n\nThank you for your time and consideration.\n\nBest regards,\n${candidateName || ""}`,
    };
  }
}

/**
 * Extract job title, company, location, and recipient email from a job description text.
 */
export async function extractJobDetails(jdText: string): Promise<{
  jobTitle: string;
  company: string;
  location: string;
  recipientEmail?: string;
}> {
  // Regex check for email addresses in the text
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const match = jdText.match(emailRegex);
  const foundEmail = match ? match[1] : undefined;

  const prompt = `
You are an expert job posting parser. Analyze the following job description text and extract the key details.

Job Description Text:
${jdText.slice(0, 5000)}

Return ONLY a valid JSON object in this exact format:
{
  "jobTitle": "The job title (e.g. Senior React Developer)",
  "company": "The company name (or 'Not specified' if not found)",
  "location": "The location (e.g. Remote, Dhaka, Bangladesh, or 'Not specified')",
  "recipientEmail": "Extracted email for applying (e.g. career@company.com or null if not found)"
}
`.trim();

  const rawJson = await callGeminiApi(prompt, "extraction", true);
  try {
    const result = JSON.parse(rawJson);
    return {
      jobTitle: result.jobTitle || "Not specified",
      company: result.company || "Not specified",
      location: result.location || "Not specified",
      recipientEmail: result.recipientEmail || foundEmail || undefined,
    };
  } catch (err) {
    console.error("Failed to parse job details JSON:", rawJson);
    return {
      jobTitle: "Not specified",
      company: "Not specified",
      location: "Not specified",
      recipientEmail: foundEmail,
    };
  }
}

/**
 * Answer structured application/screening questions using candidate profile, resume, JD, and cover letter context.
 */
export async function answerApplicationQuestion(params: {
  question: string;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  resumeContent: any;
  coverLetter?: string;
}): Promise<string> {
  const { question, jobDescription, jobTitle, company, resumeContent, coverLetter } = params;

  const prompt = `
You are an expert career consultant helping a job candidate answer a specific job application/screening question.

Question:
"${question}"

Job Details:
- Title: ${jobTitle || "Not specified"}
- Company: ${company || "Not specified"}
- Job Description (excerpt):
${jobDescription.slice(0, 3000)}

Candidate Resume Context:
${JSON.stringify(resumeContent).slice(0, 5000)}

Candidate Cover Letter Context:
${(coverLetter || "").slice(0, 3000)}

Instructions:
1. Write a professional, humanly written, compelling answer tailored specifically to this job and company.
2. Ground the answer strictly in the candidate's actual qualifications, experience, and skills as shown in the resume.
3. Be direct, concise, and persuasive (100-250 words max).
4. Do NOT use placeholders like [Your Name] or generic filler.
5. Return ONLY the answer text.
`.trim();

  const text = await callGeminiApi(prompt, "synthesis", false);
  return text.trim();
}

/**
 * Format a resume JSON object into a clean, human-readable, ATS-formatted text document.
 */
export function formatResumeToText(content: any): string {
  if (!content) return "";

  const name = content.name || "Candidate";
  const headline = content.headline || "";
  const contact = content.contact || {};
  const summary = content.summary || "";
  const skills = content.skills || [];
  const experiences = content.experiences || [];
  const projects = content.projects || [];
  const education = content.education || [];

  let text = `${name.toUpperCase()}\n`;
  if (headline) text += `${headline}\n`;

  const contactParts = [];
  if (contact.email) contactParts.push(`Email: ${contact.email}`);
  if (contact.phone) contactParts.push(`Phone: ${contact.phone}`);
  if (contact.location) contactParts.push(`Location: ${contact.location}`);
  if (contact.linkedin) contactParts.push(`LinkedIn: ${contact.linkedin}`);
  if (contact.github) contactParts.push(`GitHub: ${contact.github}`);
  if (contact.website) contactParts.push(`Website: ${contact.website}`);

  if (contactParts.length > 0) {
    text += `${contactParts.join(" | ")}\n`;
  }
  text += `${"=".repeat(60)}\n\n`;

  if (summary) {
    text += `PROFESSIONAL SUMMARY\n${"-".repeat(30)}\n${summary}\n\n`;
  }

  if (skills && skills.length > 0) {
    text += `TECHNICAL SKILLS\n${"-".repeat(30)}\n`;
    for (const skillCat of skills) {
      if (typeof skillCat === "string") {
        text += `• ${skillCat}\n`;
      } else if (skillCat.category && skillCat.items) {
        text += `${skillCat.category}: ${Array.isArray(skillCat.items) ? skillCat.items.join(", ") : skillCat.items}\n`;
      } else if (skillCat.name) {
        text += `• ${skillCat.name} (${skillCat.level || "Proficient"})\n`;
      }
    }
    text += `\n`;
  }

  if (experiences && experiences.length > 0) {
    text += `WORK EXPERIENCE\n${"-".repeat(30)}\n`;
    for (const exp of experiences) {
      text += `${exp.title || "Role"} - ${exp.company || "Company"}\n`;
      if (exp.startDate) text += `${exp.startDate} - ${exp.isCurrent ? "Present" : exp.endDate || ""}\n`;
      if (exp.description) text += `${exp.description}\n`;
      if (exp.bullets && Array.isArray(exp.bullets)) {
        for (const b of exp.bullets) {
          text += `  • ${b}\n`;
        }
      }
      text += `\n`;
    }
  }

  if (projects && projects.length > 0) {
    text += `KEY PROJECTS\n${"-".repeat(30)}\n`;
    for (const p of projects) {
      text += `${p.name}\n`;
      if (p.description) text += `${p.description}\n`;
      if (p.techStack) text += `Tech Stack: ${p.techStack}\n`;
      if (p.bullets && Array.isArray(p.bullets)) {
        for (const b of p.bullets) {
          text += `  • ${b}\n`;
        }
      }
      text += `\n`;
    }
  }

  if (education && education.length > 0) {
    text += `EDUCATION\n${"-".repeat(30)}\n`;
    for (const edu of education) {
      text += `${edu.degree || edu.institution} (${edu.year || ""})\n`;
    }
    text += `\n`;
  }

  return text.trim();
}