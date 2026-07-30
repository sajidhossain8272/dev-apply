/* eslint-disable @typescript-eslint/no-explicit-any */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in environment variables.");
}

export type ModelTier = "synthesis" | "questionnaire" | "extraction";

const MODEL_PRIORITIES: Record<ModelTier, string[]> = {
  synthesis: ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3-flash", "gemini-3.1-flash-lite"],
  questionnaire: ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3-flash"],
  extraction: ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3.5-flash-lite"],
};

/**
  Generate text with Gemini API, handling model fallbacks if 429 or rate limits occur.
 */
export async function callGeminiApi(
  prompt: string,
  tier: ModelTier = "synthesis",
  jsonMode: boolean = false
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please check your .env configuration.");
  }

  const models = MODEL_PRIORITIES[tier];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: any = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      };

      if (jsonMode) {
        payload.generationConfig = {
          responseMimeType: "application/json",
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[Gemini API Warning] Model ${model} returned status ${res.status}: ${errorText}`);
        if (res.status === 429 || res.status === 503) {
          // Rate limit or temporary service overload, try next fallback model
          lastError = new Error(`Model ${model} hit rate limit (${res.status})`);
          continue;
        }
        throw new Error(`Gemini API Error (${model}): ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(`Empty response received from Gemini model ${model}`);
      }

      return text;
    } catch (err: any) {
      console.warn(`[Gemini API Attempt Failed] Model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini model attempts failed.");
}

/**
 * Generate 3-5 kind, engaging, personalized questionnaire questions based on developer profile & GitHub data
 */
export async function generateResumeQuestions(params: {
  name?: string;
  headline?: string;
  bio?: string;
  experiences?: any[];
  projects?: any[];
  skills?: any[];
  githubUsername?: string;
  repos?: any[];
}): Promise<{ questions: { question: string; category: string; hint?: string }[] }> {
  const prompt = `
You are an encouraging, expert career coach and AI assistant helping a software developer build an ATS-friendly, highly compelling resume styled cleanly like top engineering resumes (Sajid Hossain & Mehrab Hossain style).

Analyze the developer's profile and GitHub data below:
- Name: ${params.name || "Developer"}
- Headline: ${params.headline || "Software Engineer"}
- Bio: ${params.bio || "N/A"}
- Existing Experiences: ${JSON.stringify(params.experiences || [])}
- Existing Projects: ${JSON.stringify(params.projects || [])}
- Existing Skills: ${JSON.stringify(params.skills || [])}
- GitHub Username: ${params.githubUsername || "N/A"}
- Public Repositories (sample): ${JSON.stringify((params.repos || []).slice(0, 8))}

Your Goal:
Generate 3 to 5 kind, warm, encouraging, and specific questions to ask the user. Focus on discovering:
1. Quantifiable metrics / achievements from their work or projects (e.g. % performance increase, active users, time saved).
2. Key architectural decisions or technical challenges overcome in their top repositories/projects.
3. Their desired target role, key tech stack strengths, and career highlights.

Return ONLY a JSON object in this exact format:
{
  "questions": [
    {
      "question": "Kind, warm question text directed to the developer...",
      "category": "Experience Impact / Key Project / Tech Stack / Metrics",
      "hint": "Optional helpful tip or example to guide their response..."
    }
  ]
}
`.trim();

  const rawJson = await callGeminiApi(prompt, "questionnaire", true);
  try {
    return JSON.parse(rawJson);
  } catch (err) {
    console.error("Failed to parse JSON from Gemini questionnaire response:", rawJson);
    return {
      questions: [
        {
          question: "What is your biggest technical achievement or project you are most proud of?",
          category: "Key Project",
          hint: "Include details on tools used and measurable impact.",
        },
        {
          question: "What key metrics or performance improvements have you delivered in your recent work?",
          category: "Experience Impact",
          hint: "E.g. speedup, user retention, cost savings, test coverage.",
        },
      ],
    };
  }
}

/**
 * Synthesize complete resume payload based on profile, GitHub data, questionnaire Q&A, and target template style.
 */
export async function synthesizeResumeContent(params: {
  userProfile: any;
  githubRepos: any[];
  questionAnswers: { question: string; category?: string; answer: string }[];
  style: "SAJID_STANDARD" | "MEHRAB_MINIMAL";
}): Promise<any> {
  const prompt = `
You are a elite executive tech resume writer. Your job is to format a clean, professional, ATS-optimized software developer resume matching the user's requested style layout ("${params.style}").

Reference resume guidelines:
- "SAJID_STANDARD" style: Comprehensive, bold headers, strong action-oriented bullet points, detailed project sections with repo/live links, and two-column bottom layout for Education & Additional Information.
- "MEHRAB_MINIMAL" style: Low-profile, high-density compact single-page layout, concise professional summary, high line efficiency, crisp skills categorization.

Input Context:
- User Profile: ${JSON.stringify(params.userProfile)}
- GitHub Repositories: ${JSON.stringify(params.githubRepos.slice(0, 10))}
- User's Answers to AI Questionnaire: ${JSON.stringify(params.questionAnswers)}

Instructions:
1. Synthesize all information into a structured JSON resume payload.
2. Use strong action verbs (Built, Architected, Designed, Reduced, Scaled, Deployed, Co-developed) and include numbers/metrics wherever implied.
3. Group skills cleanly (e.g., Languages & Frameworks, Tools & Platforms).
4. Format dates cleanly (e.g. "Oct 2024 – Mar 2026").
5. Return ONLY a valid JSON object matching this structure:

{
  "name": "Full Name",
  "headline": "Uppercase or crisp title (e.g., Software Developer)",
  "contact": {
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "Dhaka, Bangladesh",
    "linkedin": "https://linkedin.com/in/...",
    "github": "https://github.com/...",
    "website": "https://..."
  },
  "summary": "Professional summary paragraph emphasizing experience, tech stack, and key accomplishments...",
  "skills": [
    { "category": "Languages & Frameworks", "items": ["HTML5", "CSS3", "JavaScript", "TypeScript", "React.js", "Next.js"] },
    { "category": "Tools & Platforms", "items": ["Tailwind CSS", "Node.js", "Express.js", "Git", "Prisma", "PostgreSQL"] }
  ],
  "experiences": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "location": "Location",
      "startDate": "Oct 2024",
      "endDate": "Mar 2026",
      "isCurrent": false,
      "bullets": [
        "Built responsive, high-performing front-end features using React and Next.js.",
        "Collaborated with backend developers to integrate REST APIs and streamline deployments."
      ]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "subtitle": "Short tagline or category",
      "liveUrl": "https://...",
      "repoUrl": "https://...",
      "startDate": "Apr 2026",
      "endDate": "Present",
      "bullets": [
        "Built responsive web solution with product and checkout workflows.",
        "Improved conversion-focused UX using Next.js."
      ]
    }
  ],
  "education": [
    {
      "degree": "BSc in Computer Science & Engineering",
      "institution": "University Name",
      "year": "2021 – 2024",
      "details": ["Complete Web Development Course - Programming Hero"]
    }
  ],
  "additional": {
    "languages": "English (Fluent), Bangla (Native)",
    "interests": "Side Projects, Open Source, Esports"
  }
}
`.trim();

  const rawJson = await callGeminiApi(prompt, "synthesis", true);
  try {
    return JSON.parse(rawJson);
  } catch (err) {
    console.error("Failed to parse synthesized resume JSON:", rawJson);
    throw new Error("AI resume content synthesis returned invalid JSON formatting.");
  }
}
