/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { synthesizeResumeContent } from "@/lib/gemini";

function generateSlug(name: string): string {
  const cleanName = (name || "resume")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${cleanName}-${randomSuffix}`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { answers, style = "SAJID_STANDARD", title = "AI Generated Resume" } = body;

    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: "Answers array is required" }, { status: 400 });
    }

    // Fetch user details, profile, repositories
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
          take: 12,
          orderBy: { stars: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Synthesize content using Gemini AI
    const resumeContent = await synthesizeResumeContent({
      userProfile: {
        name: user.name,
        handle: user.handle,
        email: user.email,
        githubUsername: user.githubUsername,
        ...user.profile,
      },
      githubRepos: user.repositories || [],
      questionAnswers: answers,
      style: style as "SAJID_STANDARD" | "MEHRAB_MINIMAL",
    });

    // Determine unique slug
    const slug = generateSlug(user.name || user.handle || "developer");

    // Save to Database
    const newResume = await prisma.resume.create({
      data: {
        userId,
        slug,
        title,
        templateStyle: style as "SAJID_STANDARD" | "MEHRAB_MINIMAL",
        isPublic: true,
        content: resumeContent,
        questions: {
          create: answers.map((a: any) => ({
            question: a.question || "",
            category: a.category || "General",
            answer: a.answer || "",
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json({ success: true, resume: newResume });
  } catch (error: any) {
    console.error("Error generating resume:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate resume" },
      { status: 500 }
    );
  }
}
