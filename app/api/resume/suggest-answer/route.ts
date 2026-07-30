/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAnswerSuggestion } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { question, category, hint, userDraft } = body;

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // Fetch user profile and GitHub repos
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
          take: 8,
          orderBy: { stars: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const suggestion = await generateAnswerSuggestion({
      question,
      category,
      hint,
      userDraft,
      userProfile: {
        name: user.name,
        handle: user.handle,
        headline: user.profile?.headline,
        bio: user.profile?.bio,
        experiences: user.profile?.experiences || [],
        projects: user.profile?.projects || [],
        skills: user.profile?.skills || [],
      },
      githubRepos: user.repositories || [],
    });

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    console.error("Error generating answer suggestion:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate answer suggestion" },
      { status: 500 }
    );
  }
}
