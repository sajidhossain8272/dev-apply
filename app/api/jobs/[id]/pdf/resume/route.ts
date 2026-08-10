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

    // Sajid's default base PDF file
    if (isSajid && !(application as any).optimizeResume) {
      const resumePdfPath = path.join(process.cwd(), "Sajid-Hossain-Resume.pdf");
      if (fs.existsSync(resumePdfPath)) {
        const resumeBuffer = fs.readFileSync(resumePdfPath);
        return new NextResponse(resumeBuffer as any, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline; filename=\"Sajid-Hossain-Resume.pdf\"",
          },
        });
      }
    }

    // Dynamic tailored resume PDF for registered users or optimized resumes
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

    const pdfBuffer = await generateResumePdfBuffer(resumeContent || {});
    const candidateName = (resumeContent as any)?.name || user?.name || "Candidate";
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
