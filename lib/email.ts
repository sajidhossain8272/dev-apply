// lib/email.ts
import nodemailer from "nodemailer";

export interface UserCustomSmtp {
  host?: string | null;
  port?: number | null;
  user?: string | null;
  pass?: string | null;
  fromName?: string | null;
}

export async function sendApplicationEmail(params: {
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
  userGmailCredentials?: {
    email?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
  };
  userCustomSmtp?: UserCustomSmtp | null;
  isSajid?: boolean;
}) {
  const { to, subject, body, attachments, userGmailCredentials, userCustomSmtp, isSajid } = params;

  // 1. User's Own Custom SMTP Configuration (High Priority for all users)
  if (userCustomSmtp?.user && userCustomSmtp?.pass) {
    try {
      const cleanUser = userCustomSmtp.user.trim();
      const cleanPass = userCustomSmtp.pass.replace(/\s+/g, "");
      const host = userCustomSmtp.host?.trim() || "smtp.gmail.com";
      const port = Number(userCustomSmtp.port ?? 587);
      const fromName = userCustomSmtp.fromName?.trim() || cleanUser.split("@")[0];

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user: cleanUser,
          pass: cleanPass,
        },
      });

      await transporter.sendMail({
        from: `"${fromName}" <${cleanUser}>`,
        to,
        subject,
        text: body,
        attachments,
      });

      return { success: true, simulated: false, method: "user_smtp" };
    } catch (err: any) {
      console.error("User custom SMTP dispatch failed:", err?.message || err);
      throw new Error(`Failed to send email via your custom SMTP settings: ${err?.message || "Authentication error"}`);
    }
  }

  // 2. Direct Gmail REST API Dispatch (Using user's Google OAuth Access Token)
  if (userGmailCredentials?.accessToken) {
    try {
      const fromEmail = userGmailCredentials.email || "me";

      const streamTransporter = nodemailer.createTransport({
        streamTransport: true,
        newline: "windows",
        buffer: true,
      });

      const mailInfo = await streamTransporter.sendMail({
        from: fromEmail,
        to,
        subject,
        text: body,
        attachments,
      });

      const rawMimeBuffer: Buffer = (mailInfo as any).message;

      const apiRes = await fetch(
        "https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userGmailCredentials.accessToken}`,
            "Content-Type": "message/rfc822",
          },
          body: new Uint8Array(rawMimeBuffer) as any,
        }
      );

      if (apiRes.ok) {
        return { success: true, simulated: false, method: "gmail_api" };
      }

      const errText = await apiRes.text();
      console.warn("Gmail REST API dispatch returned non-ok:", apiRes.status, errText);
    } catch (err: any) {
      console.error("Gmail REST API dispatch failed:", err?.message || err);
    }
  }

  // 3. Fallback to System Environment Credentials (ONLY FOR SAJID HOSSAIN / ADMIN)
  if (isSajid) {
    const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
    const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT ?? 587);

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"${process.env.EMAIL_FROM_NAME || 'Sajid Hossain'}" <${smtpUser}>`,
        to,
        subject,
        text: body,
        attachments,
      });

      return { success: true, simulated: false, method: "admin_env_smtp" };
    }
  }

  // 4. If non-admin user has not configured their own SMTP
  return {
    success: false,
    simulated: true,
    method: "requires_user_smtp",
    requiresSmtpSetup: true,
    error: "Please configure your own Email & SMTP settings in Settings to send job applications from your email address.",
  };
}
