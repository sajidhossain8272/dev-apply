/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateResumeQuestions } from "@/lib/gemini";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Retrieve user profile and GitHub repositories
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
          take: 10,
          orderBy: { stars: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await generateResumeQuestions({
      name: user.name || "",
      headline: user.profile?.headline || "",
      bio: user.profile?.bio || "",
      experiences: user.profile?.experiences || [],
      projects: user.profile?.projects || [],
      skills: user.profile?.skills || [],
      githubUsername: user.githubUsername || "",
      repos: user.repositories || [],
    });

    return NextResponse.json({ questions: result.questions });
  } catch (error: any) {
    console.error("Error generating resume questionnaire:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate resume questionnaire" },
      { status: 500 }
    );
  }
}
