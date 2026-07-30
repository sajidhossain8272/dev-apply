/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const resume = await prisma.resume.findFirst({
      where: { id, userId },
      include: { questions: true },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({ resume });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch resume" }, { status: 500 });
  }
}

export async function PUT(req: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { title, templateStyle, isPublic, content } = body;

    const updated = await prisma.resume.updateMany({
      where: { id, userId },
      data: {
        ...(title && { title }),
        ...(templateStyle && { templateStyle }),
        ...(typeof isPublic === "boolean" && { isPublic }),
        ...(content && { content }),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Resume not found or not owned by user" }, { status: 404 });
    }

    const resume = await prisma.resume.findUnique({ where: { id } });
    return NextResponse.json({ success: true, resume });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update resume" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    await prisma.resume.deleteMany({
      where: { id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete resume" }, { status: 500 });
  }
}
