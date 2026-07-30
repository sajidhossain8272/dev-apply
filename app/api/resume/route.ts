/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const resumes = await prisma.resume.findMany({
      where: { userId },
      include: {
        questions: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ resumes });
  } catch (error: any) {
    console.error("Error fetching resumes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}
