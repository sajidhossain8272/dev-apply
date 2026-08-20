/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  extractJobDetails,
  calculateMatchScore,
  generateCoverLetterForJob,
  generateApplicationEmail,
  polishResumeForJob,
} from "@/lib/job-ai";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const applications = await prisma.jobApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        coverLetter: true,
        resumeVersion: true,
      },
    });

    return NextResponse.json({ applications });
  } catch (err: any) {
    console.error("GET /api/jobs error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch job applications" },
      { status: 500 }
    );
  }
}

import { getCandidateComprehensiveData } from "@/lib/candidate-profile";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await request.json();
    const { jdText, optimizeResume, customInstructions } = json;

    if (!jdText || typeof jdText !== "string" || !jdText.trim()) {
      return NextResponse.json(
        { error: "Job description text (jdText) is required" },
        { status: 400 }
      );
    }

    const cleanCustomInstructions = customInstructions?.trim() || undefined;

    // 1. Fetch comprehensive candidate data (Profile, Active Repositories, Skills, Resume Studio Base Resume)
    const { candidateName, baseResume, repositories } =
      await getCandidateComprehensiveData(session.user.id);

    // 2. Extract job details and recipient email from raw JD text
    const extracted = await extractJobDetails(jdText);
    const { jobTitle, company, location, recipientEmail } = extracted;

    // 3. Calculate ATS match score with active repo context & custom instructions
    const match = await calculateMatchScore({
      resumeContent: baseResume,
      jobDescription: jdText,
      jobTitle,
      company,
      customInstructions: cleanCustomInstructions,
      activeRepositories: repositories,
    });

    // 4. Generate ATS cover letter with real repositories & custom instructions
    const coverLetterText = await generateCoverLetterForJob({
      resumeContent: baseResume,
      jobDescription: jdText,
      jobTitle,
      company,
      customInstructions: cleanCustomInstructions,
      activeRepositories: repositories,
      matchReasons: match.reasons,
    });

    // 5. Generate application email
    const emailDraft = await generateApplicationEmail({
      resumeContent: baseResume,
      jobDescription: jdText,
      jobTitle,
      company,
      candidateName,
      recipientEmail,
    });

    // 6. Polish resume version with Resume Studio architecture, active repos, and custom instructions
    let resumeVersionData: any = null;
    if (optimizeResume) {
      const polished = await polishResumeForJob({
        resumeContent: baseResume,
        jobDescription: jdText,
        matchReasons: match.reasons,
        jobTitle,
        company,
        customInstructions: cleanCustomInstructions,
        activeRepositories: repositories,
      });
      resumeVersionData = {
        content: polished.content,
        polishNotes: polished.polishNotes,
        polishSummary: polished.polishSummary,
      };
    }

    // 7. Save JobApplication to database
    const newApplication = await prisma.jobApplication.create({
      data: {
        userId: session.user.id,
        jobTitle,
        company,
        location,
        jdText,
        jdSource: "manual",
        matchScore: match.score,
        matchReasons: match.reasons,
        analyzedAt: new Date(),
        recipientEmail: recipientEmail || null,
        emailSubject: emailDraft.subject,
        emailBody: emailDraft.body,
        optimizeResume: !!optimizeResume,
        customInstructions: cleanCustomInstructions || null,
        status: "READY",
        coverLetter: {
          create: {
            content: coverLetterText,
          },
        },
        ...(resumeVersionData && {
          resumeVersion: {
            create: resumeVersionData,
          },
        }),
      },
      include: {
        coverLetter: true,
        resumeVersion: true,
      },
    });

    return NextResponse.json({ application: newApplication });
  } catch (err: any) {
    console.error("POST /api/jobs error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create job application" },
      { status: 500 }
    );
  }
}
