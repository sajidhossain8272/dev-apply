/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { synthesizePortfolioData } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { answers = [], extractedContext = null, externalPortfolioUrl = null } = body;

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
          take: 12,
          orderBy: { stars: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Synthesize portfolio payload using Gemini 3.6 Flash / 3.5 Flash
    const synthesized = await synthesizePortfolioData({
      existingProfile: user.profile,
      githubRepos: user.repositories || [],
      questionAnswers: answers,
      extractedContext,
    });

    // Upsert Profile
    const profileData: any = {
      headline: synthesized.headline || user.profile?.headline || null,
      bio: synthesized.bio || user.profile?.bio || null,
      location: synthesized.location || user.profile?.location || null,
      currentRole: synthesized.currentRole || user.profile?.currentRole || null,
      currentCompany: synthesized.currentCompany || user.profile?.currentCompany || null,
      githubUrl: synthesized.githubUrl || user.profile?.githubUrl || null,
      linkedinUrl: synthesized.linkedinUrl || user.profile?.linkedinUrl || null,
      websiteUrl: synthesized.websiteUrl || user.profile?.websiteUrl || null,
      twitterUrl: synthesized.twitterUrl || user.profile?.twitterUrl || null,
      externalPortfolioUrl: externalPortfolioUrl || user.profile?.externalPortfolioUrl || null,
      services: synthesized.services || null,
      customSections: synthesized.customSections || null,
    };

    let profile = await prisma.profile.findUnique({ where: { userId } });

    if (profile) {
      profile = await prisma.profile.update({
        where: { userId },
        data: profileData,
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          userId,
          ...profileData,
        },
      });
    }

    // Replace Skills if provided
    if (Array.isArray(synthesized.skills) && synthesized.skills.length > 0) {
      await prisma.skill.deleteMany({ where: { profileId: profile.id } });
      await prisma.skill.createMany({
        data: synthesized.skills.map((s: any) => ({
          profileId: profile.id,
          name: s.name || s,
          level: s.level || "Expert",
        })),
      });
    }

    // Upsert Projects if provided
    if (Array.isArray(synthesized.projects) && synthesized.projects.length > 0) {
      for (const proj of synthesized.projects) {
        const existing = await prisma.project.findFirst({
          where: { profileId: profile.id, name: proj.name },
        });

        if (existing) {
          await prisma.project.update({
            where: { id: existing.id },
            data: {
              description: proj.description || null,
              url: proj.url || null,
              techStack: proj.techStack || null,
              highlight: proj.highlight ?? true,
            },
          });
        } else {
          await prisma.project.create({
            data: {
              profileId: profile.id,
              name: proj.name,
              description: proj.description || null,
              url: proj.url || null,
              techStack: proj.techStack || null,
              highlight: proj.highlight ?? true,
            },
          });
        }
      }
    }

    // Upsert Experiences if provided
    if (Array.isArray(synthesized.experiences) && synthesized.experiences.length > 0) {
      for (const exp of synthesized.experiences) {
        const existing = await prisma.experience.findFirst({
          where: { profileId: profile.id, company: exp.company, title: exp.title },
        });

        const startDate = exp.startDate ? new Date(exp.startDate) : new Date();
        const endDate = exp.endDate && exp.endDate !== "Present" ? new Date(exp.endDate) : null;

        if (existing) {
          await prisma.experience.update({
            where: { id: existing.id },
            data: {
              location: exp.location || null,
              description: exp.description || null,
              isCurrent: exp.isCurrent ?? !endDate,
            },
          });
        } else {
          await prisma.experience.create({
            data: {
              profileId: profile.id,
              company: exp.company,
              title: exp.title,
              location: exp.location || null,
              startDate,
              endDate,
              isCurrent: exp.isCurrent ?? !endDate,
              description: exp.description || null,
            },
          });
        }
      }
    }

    // Retrieve updated complete profile
    const updatedProfile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        experiences: true,
        projects: true,
        skills: true,
      },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error("Error synthesizing portfolio:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synthesize portfolio" },
      { status: 500 }
    );
  }
}
