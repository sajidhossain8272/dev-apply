/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { settings: true },
    });

    const isSajid =
      user?.handle === "sajidhossain8272" ||
      user?.email?.toLowerCase().includes("sajidhossain8272") ||
      user?.name?.toLowerCase().includes("sajid hossain");

    return NextResponse.json({
      isSajid,
      isConfigured: !!(user?.settings?.smtpUser && user?.settings?.smtpPass),
      smtpUser: user?.settings?.smtpUser || "",
      smtpFromName: user?.settings?.smtpFromName || user?.name || "",
      smtpHost: user?.settings?.smtpHost || "smtp.gmail.com",
      smtpPort: user?.settings?.smtpPort || 587,
    });
  } catch (error: any) {
    console.error("GET /api/user/smtp error:", error);
    return NextResponse.json({ error: "Failed to fetch SMTP settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { smtpUser, smtpPass, smtpFromName, smtpHost, smtpPort, testConnection } =
      await request.json();

    const cleanUser = smtpUser?.trim();
    const cleanPass = smtpPass?.replace(/\s+/g, "");
    const host = smtpHost?.trim() || "smtp.gmail.com";
    const port = Number(smtpPort ?? 587);
    const fromName = smtpFromName?.trim() || cleanUser?.split("@")[0] || "Developer";

    if (!cleanUser || !cleanPass) {
      return NextResponse.json(
        { error: "Email Address and App Password / SMTP Password are required." },
        { status: 400 }
      );
    }

    // If testConnection requested, verify credentials with nodemailer before saving
    if (testConnection) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user: cleanUser,
            pass: cleanPass,
          },
        });

        await transporter.verify();
      } catch (smtpErr: any) {
        console.error("SMTP verification test failed:", smtpErr);
        return NextResponse.json(
          {
            error: `Connection test failed: ${smtpErr.message || "Invalid email or app password."}`,
          },
          { status: 400 }
        );
      }
    }

    // Upsert UserSettings
    await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        smtpUser: cleanUser,
        smtpPass: cleanPass,
        smtpFromName: fromName,
        smtpHost: host,
        smtpPort: port,
      },
      update: {
        smtpUser: cleanUser,
        smtpPass: cleanPass,
        smtpFromName: fromName,
        smtpHost: host,
        smtpPort: port,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Personal Email & SMTP settings saved and verified successfully!",
    });
  } catch (error: any) {
    console.error("POST /api/user/smtp error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save SMTP settings" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        smtpUser: null,
        smtpPass: null,
        smtpFromName: null,
      },
      update: {
        smtpUser: null,
        smtpPass: null,
        smtpFromName: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Custom SMTP settings cleared successfully.",
    });
  } catch (error: any) {
    console.error("DELETE /api/user/smtp error:", error);
    return NextResponse.json({ error: "Failed to clear SMTP settings" }, { status: 500 });
  }
}
