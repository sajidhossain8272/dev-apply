/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePortfolioQuestions } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json().catch(() => ({}));
    const { extractedContext } = body;

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

    const result = await generatePortfolioQuestions({
      profile: user.profile,
      githubRepos: user.repositories || [],
      extractedContext: extractedContext || null,
    });

    return NextResponse.json({ questions: result.questions });
  } catch (error: any) {
    console.error("Error generating portfolio questionnaire:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate portfolio questionnaire" },
      { status: 500 }
    );
  }
}
