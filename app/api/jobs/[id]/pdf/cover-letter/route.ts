/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCoverLetterPdfBuffer } from "@/lib/pdf-generator";

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
      include: { coverLetter: true },
    });

    if (!application || !application.coverLetter?.content) {
      return NextResponse.json({ error: "Cover letter not found" }, { status: 404 });
    }

    const pdfBuffer = await generateCoverLetterPdfBuffer({
      text: application.coverLetter.content,
      candidateName: session.user.name || "Candidate",
      jobTitle: application.jobTitle || undefined,
      company: application.company || undefined,
    });

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"Cover-Letter.pdf\"",
      },
    });
  } catch (err: any) {
    console.error("GET /api/jobs/[id]/pdf/cover-letter error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate cover letter PDF" },
      { status: 500 }
    );
  }
}
