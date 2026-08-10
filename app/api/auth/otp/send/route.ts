/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 2. Remove old OTP tokens for this email
    await prisma.otpToken.deleteMany({ where: { email: cleanEmail } });

    // 3. Store new OTP token in database
    await prisma.otpToken.create({
      data: {
        email: cleanEmail,
        code: otpCode,
        expiresAt,
      },
    });

    // 4. Send Email via Gmail SMTP / App Password
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"Dev-Apply Security" <${smtpUser}>`,
        to: cleanEmail,
        subject: `Your Dev-Apply Verification Code: ${otpCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 30px; borderRadius: 12px;">
            <h2 style="color: #10b981; margin-bottom: 8px;">Dev-Apply Account Security</h2>
            <p style="font-size: 14px; color: #a1a1aa;">Use the 6-digit verification code below to complete your sign-in or registration:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; color: #34d399; padding: 16px; display: inline-block; margin: 20px 0;">
              ${otpCode}
            </div>
            <p style="font-size: 12px; color: #71717a;">This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } else {
      console.log(`[DEV OTP LOG] Verification code for ${cleanEmail}: ${otpCode}`);
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
    });
  } catch (err: any) {
    console.error("POST /api/auth/otp/send error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send OTP verification email" },
      { status: 500 }
    );
  }
}
