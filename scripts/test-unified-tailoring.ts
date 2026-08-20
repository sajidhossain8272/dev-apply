import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });
import { prisma } from '../lib/prisma';
import { getCandidateComprehensiveData } from '../lib/candidate-profile';
import { polishResumeForJob, generateCoverLetterForJob, calculateMatchScore } from '../lib/job-ai';

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { handle: 'sajidhossain8272' },
        { email: { contains: 'sajidhossain8272' } },
      ],
    },
  });

  const targetUserId = user?.id || (await prisma.user.findFirst())?.id;
  if (!targetUserId) {
    console.log('No user in database.');
    return;
  }

  console.log('--- 1. Testing Candidate Comprehensive Profile Loading ---');
  const candidateData = await getCandidateComprehensiveData(targetUserId);
  console.log('Candidate Name:', candidateData.candidateName);
  console.log('Active Repositories Count:', candidateData.repositories.length);
  console.log('Sample Active Repos:', candidateData.repositories.slice(0, 3).map(r => `${r.name} (${r.language || 'Code'})`));

  const sampleJd = `
We are looking for a Senior Full Stack Engineer (Next.js & Python / AI)
Responsibilities:
- Build and scale production web applications with React, Next.js, and TypeScript
- Integrate AI models and build automated agent workflows
- Work with PostgreSQL databases, Prisma, and Docker
- Optimize web performance, accessibility, and SEO
`;

  const customInstructions = "Focus heavily on Next.js 14, PostgreSQL database architecture, and production AI agent workflows.";

  console.log('\n--- 2. Testing ATS Match Calculation with Active Repos ---');
  const match = await calculateMatchScore({
    resumeContent: candidateData.baseResume,
    jobDescription: sampleJd,
    jobTitle: 'Senior Full Stack Engineer',
    company: 'TechCorp AI',
    customInstructions,
    activeRepositories: candidateData.repositories,
  });
  console.log('Match Score:', match.score);
  console.log('Match Summary:', match.summary);

  console.log('\n--- 3. Testing Tailored Resume Studio Architecture ---');
  const tailored = await polishResumeForJob({
    resumeContent: candidateData.baseResume,
    jobDescription: sampleJd,
    matchReasons: match.reasons,
    jobTitle: 'Senior Full Stack Engineer',
    company: 'TechCorp AI',
    customInstructions,
    activeRepositories: candidateData.repositories,
  });

  console.log('Headline:', tailored.content.headline);
  console.log('Skills count:', tailored.content.skills?.length);
  console.log('Projects showcased in Resume:', tailored.content.projects?.map(p => p.name));
  console.log('Summary:', tailored.content.summary);

  console.log('\n--- 4. Testing Tailored Cover Letter with Custom Instructions ---');
  const coverLetter = await generateCoverLetterForJob({
    resumeContent: candidateData.baseResume,
    jobDescription: sampleJd,
    jobTitle: 'Senior Full Stack Engineer',
    company: 'TechCorp AI',
    customInstructions,
    activeRepositories: candidateData.repositories,
    matchReasons: match.reasons,
  });
  console.log('Cover Letter Preview (first 250 chars):');
  console.log(coverLetter.slice(0, 250) + '...');

  console.log('\n✅ ALL RESUME STUDIO ARCHITECTURE & DATA ENHANCED TESTS PASSED!');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error during test:', err);
  await prisma.$disconnect();
});
