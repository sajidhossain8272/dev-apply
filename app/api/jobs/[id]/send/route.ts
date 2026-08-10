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

    // Fetch user to check profile & identity
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: {
          include: { experiences: true, projects: true, skills: true },
        },
      },
    });

    const isSajid =
      user?.handle === "sajidhossain8272" ||
      user?.email?.toLowerCase().includes("sajidhossain8272") ||
      user?.name?.toLowerCase().includes("sajid hossain");

    // Prepare attachments
    const attachments: Array<{
      filename: string;
      content?: Buffer | string;
      path?: string;
      contentType?: string;
    }> = [];

    // 1. Resume Attachment Selection
    if (isSajid && !application.optimizeResume) {
      // Sajid's default base PDF file
      const resumePdfPath = path.join(process.cwd(), "Sajid-Hossain-Resume.pdf");
      if (fs.existsSync(resumePdfPath)) {
        const resumeBuffer = fs.readFileSync(resumePdfPath);
        attachments.push({
          filename: "Sajid-Hossain-Resume.pdf",
          content: resumeBuffer,
          contentType: "application/pdf",
        });
      }
    } else {
      // Dynamic tailored resume generated from user's profile / Resume Studio / ResumeVersion
      const { formatResumeToText } = await import("@/lib/job-ai");

      let resumeContent = application.resumeVersion?.content;

      if (!resumeContent) {
        const defaultResume = await prisma.resume.findFirst({
          where: { userId: session.user.id },
          orderBy: { updatedAt: "desc" },
        });
        resumeContent = defaultResume?.content;
      }

      if (!resumeContent && user?.profile) {
        resumeContent = JSON.parse(
          JSON.stringify({
            name: user.name || "Candidate",
            headline: user.profile.headline || "Software Engineer",
            contact: {
              email: user.email || "",
              phone: user.phone || "",
              location: user.profile.location || "",
              github: user.profile.githubUrl || "",
              linkedin: user.profile.linkedinUrl || "",
            },
            summary: user.profile.bio || "",
            skills: user.profile.skills || [],
            experiences: user.profile.experiences || [],
            projects: user.profile.projects || [],
          })
        );
      }

      const { generateResumePdfBuffer } = await import("@/lib/pdf-generator");

      const candidateName = (resumeContent as any)?.name || user?.name || "Candidate";
      const safeFilename = candidateName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const resumePdfBuffer = await generateResumePdfBuffer(resumeContent);

      attachments.push({
        filename: `${safeFilename}-Tailored-Resume.pdf`,
        content: resumePdfBuffer,
        contentType: "application/pdf",
      });
    }

    // 2. Cover Letter Attachment in PDF format
    if (application.coverLetter?.content) {
      const { generateCoverLetterPdfBuffer } = await import("@/lib/pdf-generator");
      const coverLetterPdfBuffer = await generateCoverLetterPdfBuffer({
        text: application.coverLetter.content,
        candidateName: user?.name || "Candidate",
        jobTitle: application.jobTitle || undefined,
        company: application.company || undefined,
      });

      attachments.push({
        filename: "Cover-Letter.pdf",
        content: coverLetterPdfBuffer,
        contentType: "application/pdf",
      });
    }

    // Dispatch application email
    const result = await sendApplicationEmail({
      to: recipientEmail.trim(),
      subject,
      body,
      attachments,
      userGmailCredentials: {
        email: user?.gmailEmail || user?.email,
        accessToken: user?.gmailAccessToken,
        refreshToken: user?.gmailRefreshToken,
      },
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
      requiresGoogleAuth: !!result.requiresGoogleAuth,
      method: result.method,
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
