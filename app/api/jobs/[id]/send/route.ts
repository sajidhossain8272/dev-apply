/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendApplicationEmail } from "@/lib/email";
import fs from "fs";
import path from "path";

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

    const recipientEmail = application.recipientEmail;
    if (!recipientEmail || !recipientEmail.trim()) {
      return NextResponse.json(
        { error: "Recipient email is missing for this job application." },
        { status: 400 }
      );
    }

    const subject = application.emailSubject || `Job Application for ${application.jobTitle || "Position"}`;
    const body = application.emailBody || "Please find my resume and cover letter attached.\n\nBest regards";

    // Prepare attachments
    const attachments: Array<{
      filename: string;
      content?: Buffer | string;
      path?: string;
      contentType?: string;
    }> = [];

    // 1. Primary PDF Resume Attachment
    const resumePdfPath = path.join(process.cwd(), "Sajid-Hossain-Resume.pdf");
    if (fs.existsSync(resumePdfPath)) {
      const resumeBuffer = fs.readFileSync(resumePdfPath);
      attachments.push({
        filename: "Sajid-Hossain-Resume.pdf",
        content: resumeBuffer,
        contentType: "application/pdf",
      });
    }

    // 2. Cover Letter Attachment (if present)
    if (application.coverLetter?.content) {
      attachments.push({
        filename: "Cover-Letter.txt",
        content: application.coverLetter.content,
        contentType: "text/plain",
      });
    }

    // Dispatch application email
    const result = await sendApplicationEmail({
      to: recipientEmail.trim(),
      subject,
      body,
      attachments,
    });

    // Update application status in DB to SENT
    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
      include: {
        coverLetter: true,
        resumeVersion: true,
      },
    });

    return NextResponse.json({
      success: true,
      simulated: result.simulated,
      application: updated,
    });
  } catch (err: any) {
    console.error("POST /api/jobs/[id]/send error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send job application email" },
      { status: 500 }
    );
  }
}
