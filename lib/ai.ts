export async function generateCoverLetter(params: {
  jobTitle: string;
  company: string;
  jobDescription?: string;
  profileSummary: string;
  skills: string[];
}) {
  // For now return a static template. Connect to your AI later.
  const { jobTitle, company, jobDescription, profileSummary, skills } = params;

  const skillsList = skills.join(", ");

  return `
Dear Hiring Manager at ${company},

I am writing to express my interest in the ${jobTitle} position.

${profileSummary}

My core skills include ${skillsList}. I believe these match the requirements of this role${
    jobDescription ? " as described in the job posting" : ""
  }.

Thank you for considering my application.

Best regards,
[Your Name Here]
  `.trim();
}
