/* eslint-disable @typescript-eslint/no-explicit-any */

import { callGeminiApi } from "./gemini";

/**
 * Calculate a match score (0-100) between a resume and a job description.
 * Returns the score plus detailed reasons for matched/missing skills.
 */
export async function calculateMatchScore(params: {
  resumeContent: any;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
}): Promise<{
  score: number;
  reasons: { reason: string; matched: boolean; category: string }[];
  summary: string;
}> {
  const { resumeContent, jobDescription, jobTitle, company } = params;

  const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer and technical recruiter.

Job Details:
- Title: ${jobTitle || "Not specified"}
- Company: ${company || "Not specified"}
- Job Description:
${jobDescription.slice(0, 8000)}

Candidate Resume (JSON):
${JSON.stringify(resumeContent).slice(0, 8000)}

Task:
Analyze how well the candidate's resume matches the job description. Consider:
1. Required skills match (technical skills, frameworks, languages)
2. Experience relevance (years, domain, role similarity)
3. Project relevance (technologies used, scope)
4. Education and certifications
5. Keywords and ATS optimization

Return ONLY a valid JSON object in this exact format:
{
  "score": 85,
  "summary": "Brief 1-2 sentence summary of the match quality.",
  "reasons": [
    { "reason": "React.js - Required and present in resume", "matched": true, "category": "Skills" },
    { "reason": "AWS experience - Required but not mentioned", "matched": false, "category": "Skills" },
    { "reason": "3+ years experience - Job requires 3+, candidate has 4+", "matched": true, "category": "Experience" }
  ]
}

The score should be 0-100 where:
- 90-100: Excellent match
- 75-89: Good match
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
      score: 0,
      reasons: [],
      summary: "Failed to analyze match. Please try again.",
    };
  }
}

/**
 * Polish/optimize a resume for a specific job description.
 * Creates a new resume version tailored to the job while keeping it truthful.
 */
export async function polishResumeForJob(params: {
  resumeContent: any;
  jobDescription: string;
  matchReasons?: any[];
  jobTitle?: string;
  company?: string;
}): Promise<{
  content: any;
  polishNotes: string;
  polishSummary: string;
}> {
  const { resumeContent, jobDescription, matchReasons, jobTitle, company } = params;

  const prompt = `
You are an elite executive resume writer and ATS optimization expert.

Job Details:
- Title: ${jobTitle || "Not specified"}
- Company: ${company || "Not specified"}
- Job Description:
${jobDescription.slice(0, 8000)}

Current Resume (JSON):
${JSON.stringify(resumeContent).slice(0, 8000)}

${matchReasons ? `Match Analysis Gaps to Address:\n${JSON.stringify(matchReasons)}` : ""}

Instructions:
1. Polish and optimize the resume to better match this specific job description.
2. Reorder and emphasize relevant skills, experiences, and projects.
3. Refine bullet points to use keywords from the job description (without lying).
4. Adjust the professional summary to align with the target role.
5. Keep all information truthful - do not fabricate experience or skills.
6. Maintain the same JSON structure as the input resume.

Return ONLY a valid JSON object in this exact format:
{
  "content": { ... the polished resume JSON, same structure as input ... },
  "polishNotes": "Detailed list of what was changed and why (bullet points)",
  "polishSummary": "Brief 1-2 sentence summary of the optimization"
}

The content JSON must match this structure:
{
  "name": "Full Name",
  "headline": "Title",
  "contact": { "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "website": "" },
  "summary": "Professional summary paragraph",
  "skills": [{ "category": "Category", "items": ["Skill1", "Skill2"] }],
  "experiences": [{ "company": "", "title": "", "location": "", "startDate": "", "endDate": "", "isCurrent": false, "bullets": [""] }],
  "projects": [{ "name": "", "subtitle": "", "liveUrl": "", "repoUrl": "", "startDate": "", "endDate": "", "bullets": [""] }],
  "education": [{ "degree": "", "institution": "", "year": "", "details": [""] }],
  "additional": { "languages": "", "interests": "" }
}
`.trim();

  const rawJson = await callGeminiApi(prompt, "synthesis", true);
  try {
    const result = JSON.parse(rawJson);
    return {
      content: result.content || resumeContent,
      polishNotes: result.polishNotes || "No notes available.",
      polishSummary: result.polishSummary || "Resume polished for this job.",
    };
  } catch (err) {
    console.error("Failed to parse polished resume JSON:", rawJson);
    throw new Error("AI resume polish returned invalid JSON formatting.");
  }
}

/**
 * Generate a cover letter for a specific job application.
 */
export async function generateCoverLetterForJob(params: {
  resumeContent: any;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  matchReasons?: any[];
}): Promise<string> {
  const { resumeContent, jobDescription, jobTitle, company, matchReasons } = params;

  const prompt = `
You are an expert cover letter writer. Write a compelling, professional cover letter for this job application.

Job Details:
- Title: ${jobTitle || "Not specified"}
- Company: ${company || "Not specified"}
- Job Description:
${jobDescription.slice(0, 6000)}

Candidate Resume (JSON):
${JSON.stringify(resumeContent).slice(0, 6000)}

${matchReasons ? `Key Match Points:\n${JSON.stringify(matchReasons)}` : ""}

Instructions:
1. Write a professional cover letter (300-400 words).
2. Address it to "Dear Hiring Manager" if no specific name is available.
3. Highlight 2-3 specific achievements or skills from the resume that directly match the job requirements.
4. Show enthusiasm for the company and role.
5. Keep it concise, professional, and free of clichés.
6. Do not use placeholders like [Your Name] - use the actual name from the resume.
7. Output ONLY the cover letter text, no markdown wrappers or extra commentary.
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