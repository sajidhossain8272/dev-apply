import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileInputSchema } from "@/lib/validation";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: {
        include: {
          experiences: true,
          projects: true,
          skills: true,
        },
      },
      settings: true,
    },
  });

  // If first time, create minimal profile from user
  if (!user?.profile) {
    const created = await prisma.profile.create({
      data: {
        userId: session.user.id,
        headline: "Software Developer",
        bio: "",
        location: "",
        currentCompany: "",
        currentRole: "",
        githubUrl: "",
        linkedinUrl: "",
        websiteUrl: "",
        twitterUrl: "",
      },
    });

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });

    return NextResponse.json({
      user: { ...user, profile: created, settings },
    });
  }

  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json();

  const parsed = ProfileInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Ensure handle is unique (except for this user)
  const existingWithHandle = await prisma.user.findFirst({
    where: {
      handle: data.handle,
      NOT: { id: session.user.id },
    },
  });

  if (existingWithHandle) {
    return NextResponse.json(
      { error: "Handle already taken" },
      { status: 409 }
    );
  }

  // Make sure user + profile exists
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      handle: data.handle,
      profile: {
        upsert: {
          create: {
            headline: data.headline,
            bio: data.bio,
            location: data.location,
            currentCompany: data.currentCompany,
            currentRole: data.currentRole,
            githubUrl: data.links.github,
            linkedinUrl: data.links.linkedin,
            websiteUrl: data.links.website,
            twitterUrl: data.links.twitter,
            experiences: {
              create: data.experiences.map((exp) => ({
                company: exp.company,
                title: exp.title,
                location: exp.location,
                startDate: new Date(exp.startDate),
                endDate: exp.endDate ? new Date(exp.endDate) : null,
                isCurrent: exp.isCurrent,
                description: exp.description,
              })),
            },
            projects: {
              create: data.projects.map((p) => ({
                name: p.name,
                description: p.description,
                url: p.url,
                highlight: !!p.highlight,
                techStack: p.techStack,
              })),
            },
            skills: {
              create: data.skills.map((s) => ({
                name: s.name,
                level: s.level,
              })),
            },
          },
          update: {
            headline: data.headline,
            bio: data.bio,
            location: data.location,
            currentCompany: data.currentCompany,
            currentRole: data.currentRole,
            githubUrl: data.links.github,
            linkedinUrl: data.links.linkedin,
            websiteUrl: data.links.website,
            twitterUrl: data.links.twitter,
            experiences: {
              deleteMany: {},
              create: data.experiences.map((exp) => ({
                company: exp.company,
                title: exp.title,
                location: exp.location,
                startDate: new Date(exp.startDate),
                endDate: exp.endDate ? new Date(exp.endDate) : null,
                isCurrent: exp.isCurrent,
                description: exp.description,
              })),
            },
            projects: {
              deleteMany: {},
              create: data.projects.map((p) => ({
                name: p.name,
                description: p.description,
                url: p.url,
                highlight: !!p.highlight,
                techStack: p.techStack,
              })),
            },
            skills: {
              deleteMany: {},
              create: data.skills.map((s) => ({
                name: s.name,
                level: s.level,
              })),
            },
          },
        },
      },
      settings: {
        upsert: {
          create: {
            availability: data.availability,
          },
          update: {
            availability: data.availability,
          },
        },
      },
    },
    include: {
      profile: {
        include: { experiences: true, projects: true, skills: true },
      },
      settings: true,
    },
  });

  return NextResponse.json({ user });
}
