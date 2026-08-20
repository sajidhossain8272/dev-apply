import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSajidAccount, SAJID_BASE_RESUME } from "@/lib/sajid-profile";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!isSajidAccount(user)) return NextResponse.json({ error: "Personal workspace unavailable" }, { status: 403 });
  const existing = await prisma.resume.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  if (existing) return NextResponse.json({ resume: existing, seeded: false });
  const resume = await prisma.resume.create({ data: { userId: user.id, slug: `sajid-base-${Date.now()}`, title: "Sajid Hossain - Base Resume", content: SAJID_BASE_RESUME } });
  return NextResponse.json({ resume, seeded: true });
}
