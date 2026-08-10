/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { answerApplicationQuestion } from "@/lib/job-ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const application = await prisma.jobApplication.findFirst({
      where: { id, userId: session.user.id },
      include: { coverLetter: true, resumeVersion: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Job application not found" }, { status: 404 });
    }

    const json = await request.json();
    const { question } = json;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Question text is required" },
        { status: 400 }
      );
    }

    // Candidate resume context
    const defaultResume = await prisma.resume.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    const resumeContent = application.resumeVersion?.content || defaultResume?.content || {};
    const coverLetterText = application.coverLetter?.content || "";

    const answer = await answerApplicationQuestion({
      question: question.trim(),
      jobDescription: application.jdText,
      jobTitle: application.jobTitle || undefined,
      company: application.company || undefined,
      resumeContent,
      coverLetter: coverLetterText,
    });

    // Append to existing qaPairs array
    const existingQa = (application.qaPairs as any[]) || [];
    const newQaItem = {
      id: `qa_${Date.now()}`,
      question: question.trim(),
      answer,
      createdAt: new Date().toISOString(),
    };
    const updatedQaPairs = [...existingQa, newQaItem];

    const updatedApplication = await prisma.jobApplication.update({
      where: { id },
      data: {
        qaPairs: updatedQaPairs,
      },
    });

    return NextResponse.json({
      answer,
      qaPairs: updatedApplication.qaPairs,
    });
  } catch (err: any) {
    console.error("POST /api/jobs/[id]/qa error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate AI answer" },
      { status: 500 }
    );
  }
}
