/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateResumePdfBuffer } from "@/lib/pdf-generator";
import fs from "fs";
import path from "path";

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
      where: { id, userId: session.user.id },
      include: { resumeVersion: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Job application not found" }, { status: 404 });
    }

    const { getCandidateComprehensiveData } = await import("@/lib/candidate-profile");
    const { baseResume, candidateName } = await getCandidateComprehensiveData(session.user.id);

    // Dynamic tailored resume PDF for registered users or optimized resumes
    const resumeContent = application.resumeVersion?.content || baseResume;

    const pdfBuffer = await generateResumePdfBuffer(resumeContent || {});
    const safeFilename = candidateName.replace(/[^a-zA-Z0-9_-]/g, "_");

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeFilename}-Resume.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("GET /api/jobs/[id]/pdf/resume error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate resume PDF" },
      { status: 500 }
    );
  }
}
