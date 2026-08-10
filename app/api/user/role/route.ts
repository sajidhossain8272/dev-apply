/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { role } = await request.json();

    if (role !== "DEVELOPER" && role !== "CLIENT") {
      return NextResponse.json({ error: "Invalid role. Choose DEVELOPER or CLIENT." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role,
        roleSelected: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        roleSelected: updatedUser.roleSelected,
      },
    });
  } catch (err: any) {
    console.error("POST /api/user/role error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update user role" },
      { status: 500 }
    );
  }
}
