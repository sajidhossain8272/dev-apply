export type SuggestedJob = {
  id: string;
  title: string;
  company: string;
  location?: string;
  url: string;
  source: string; // e.g. "linkedin", "github", "custom"
  matchScore?: number;
};

export async function fetchJobSuggestionsForUser(userId: string) {
  if (!process.env.N8N_JOB_WEBHOOK_URL) {
    // Demo data if n8n not configured
    const example: SuggestedJob[] = [
      {
        id: "demo-1",
        title: "Full-stack TypeScript Engineer",
        company: "Example Corp",
        location: "Remote",
        url: "https://example.com/jobs/1",
        source: "demo",
        matchScore: 0.9,
      },
    ];
    return example;
  }

  const res = await fetch(process.env.N8N_JOB_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch job suggestions from n8n");
  }

  const data = (await res.json()) as SuggestedJob[];
  return data;
}
