/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const where: any = { status: "OPEN" };
    if (type) where.type = type;

    const jobs = await prisma.marketplaceJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        postedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            handle: true,
          },
        },
      },
    });

    return NextResponse.json({ jobs });
  } catch (err: any) {
    console.error("GET /api/marketplace/jobs error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch marketplace jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, company, type, budget, location, description, applyEmail } = await request.json();

    if (!title || !company || !description) {
      return NextResponse.json(
        { error: "Title, company, and description are required." },
        { status: 400 }
      );
    }

    const job = await prisma.marketplaceJob.create({
      data: {
        postedById: session.user.id,
        title,
        company,
        type: type || "FULL_TIME",
        budget: budget || null,
        location: location || "Remote",
        description,
        applyEmail: applyEmail || session.user.email || "",
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (err: any) {
    console.error("POST /api/marketplace/jobs error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to post job / freelance task" },
      { status: 500 }
    );
  }
}
