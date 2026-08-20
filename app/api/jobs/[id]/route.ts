/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { polishResumeForJob, generateCoverLetterForJob } from "@/lib/job-ai";

export async function GET(
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
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        coverLetter: true,
        resumeVersion: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Job application not found" }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (err: any) {
    console.error("GET /api/jobs/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch job application" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const existing = await prisma.jobApplication.findFirst({
      where: { id, userId: session.user.id },
      include: { coverLetter: true, resumeVersion: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Job application not found" }, { status: 404 });
    }

    const json = await request.json();
    const {
      jobTitle,
      company,
      location,
      recipientEmail,
      emailSubject,
      emailBody,
      coverLetterContent,
      optimizeResume,
      customInstructions,
      regenerateCoverLetter,
      regenerateResume,
      status,
    } = json;

    const cleanCustomInstructions =
      customInstructions !== undefined
        ? customInstructions?.trim() || null
        : existing.customInstructions;

    // Load comprehensive candidate profile & real repositories
    const { getCandidateComprehensiveData } = await import("@/lib/candidate-profile");
    const { baseResume, repositories } = await getCandidateComprehensiveData(session.user.id);

    let updatedCoverLetterContent = coverLetterContent;
    if (regenerateCoverLetter) {
      updatedCoverLetterContent = await generateCoverLetterForJob({
        resumeContent: baseResume,
        jobDescription: existing.jdText,
        jobTitle: jobTitle || existing.jobTitle || undefined,
        company: company || existing.company || undefined,
        customInstructions: cleanCustomInstructions || undefined,
        activeRepositories: repositories,
        matchReasons: existing.matchReasons as any[],
      });
    }

    // Check if resume should be polished / regenerated with custom instructions
    let resumeVersionData: any = undefined;
    if (regenerateResume || (optimizeResume && !existing.resumeVersion)) {
      const polished = await polishResumeForJob({
        resumeContent: baseResume,
        jobDescription: existing.jdText,
        matchReasons: existing.matchReasons as any[],
        jobTitle: jobTitle || existing.jobTitle || undefined,
        company: company || existing.company || undefined,
        customInstructions: cleanCustomInstructions || undefined,
        activeRepositories: repositories,
      });

      resumeVersionData = {
        upsert: {
          create: {
            content: polished.content,
            polishNotes: polished.polishNotes,
            polishSummary: polished.polishSummary,
          },
          update: {
            content: polished.content,
            polishNotes: polished.polishNotes,
            polishSummary: polished.polishSummary,
          },
        },
      };
    }

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        ...(jobTitle !== undefined && { jobTitle }),
        ...(company !== undefined && { company }),
        ...(location !== undefined && { location }),
        ...(recipientEmail !== undefined && { recipientEmail }),
        ...(emailSubject !== undefined && { emailSubject }),
        ...(emailBody !== undefined && { emailBody }),
        ...(optimizeResume !== undefined && { optimizeResume: !!optimizeResume }),
        ...(customInstructions !== undefined && { customInstructions: cleanCustomInstructions }),
        ...(status !== undefined && { status }),
        ...(updatedCoverLetterContent !== undefined && {
          coverLetter: {
            upsert: {
              create: { content: updatedCoverLetterContent },
              update: { content: updatedCoverLetterContent },
            },
          },
        }),
        ...(resumeVersionData && {
          resumeVersion: resumeVersionData,
        }),
      },
      include: {
        coverLetter: true,
        resumeVersion: true,
      },
    });

    return NextResponse.json({ application: updated });
  } catch (err: any) {
    console.error("PUT /api/jobs/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update job application" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const existing = await prisma.jobApplication.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Job application not found" }, { status: 404 });
    }

    await prisma.jobApplication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/jobs/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete job application" },
      { status: 500 }
    );
  }
}
