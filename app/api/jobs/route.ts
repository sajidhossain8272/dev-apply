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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await request.json();
    const { jdText, optimizeResume } = json;

    if (!jdText || typeof jdText !== "string" || !jdText.trim()) {
      return NextResponse.json(
        { error: "Job description text (jdText) is required" },
        { status: 400 }
      );
    }

    // 1. Fetch user's default resume or primary profile
    const defaultResume = await prisma.resume.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    let resumeContent: any = defaultResume?.content;
    if (!resumeContent) {
      // Fallback resume content if user hasn't created a resume in DB yet
      resumeContent = {
        name: session.user.name || "Sajid Hossain",
        headline: "Senior Full Stack Developer",
        contact: {
          email: session.user.email || "sajidhossain8272@gmail.com",
          github: "https://github.com/sajidhossain8272",
        },
        skills: [
          { category: "Frontend", items: ["React.js", "Next.js", "TypeScript", "TailwindCSS"] },
          { category: "Backend", items: ["Node.js", "Django", "Python", "PostgreSQL", "REST APIs"] },
        ],
        experiences: [
          {
            company: "Full Stack Engineer",
            title: "Senior Full Stack Developer",
            startDate: "2022-01-01",
            isCurrent: true,
            bullets: ["Developed scalable web applications using React, Next.js, and Node.js/Django."],
          },
        ],
      };
    }

    // 2. Extract job details and recipient email from raw JD text
    const extracted = await extractJobDetails(jdText);
    const { jobTitle, company, location, recipientEmail } = extracted;

    // 3. Calculate ATS match score
    const match = await calculateMatchScore({
      resumeContent,
      jobDescription: jdText,
      jobTitle,
      company,
    });

    // 4. Generate ATS cover letter
    const coverLetterText = await generateCoverLetterForJob({
      resumeContent,
      jobDescription: jdText,
      jobTitle,
      company,
      matchReasons: match.reasons,
    });

    // 5. Generate application email
    const emailDraft = await generateApplicationEmail({
      resumeContent,
      jobDescription: jdText,
      jobTitle,
      company,
      candidateName: (resumeContent as any)?.name || session.user.name || "Sajid Hossain",
      recipientEmail,
    });

    // 6. If optimizeResume requested, polish resume version
    let resumeVersionData: any = null;
    if (optimizeResume) {
      const polished = await polishResumeForJob({
        resumeContent,
        jobDescription: jdText,
        matchReasons: match.reasons,
        jobTitle,
        company,
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
