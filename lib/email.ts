// lib/email.ts
import nodemailer from "nodemailer";

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
}) {
  const { to, subject, body, attachments, userGmailCredentials } = params;

  // 1. Google OAuth2 Direct Gmail Transport
  if (
    userGmailCredentials?.accessToken &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  ) {
    try {
      const fromEmail = userGmailCredentials.email || process.env.SMTP_USER || "me";
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: fromEmail,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: userGmailCredentials.refreshToken || undefined,
          accessToken: userGmailCredentials.accessToken,
        },
      });

      await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        text: body,
        attachments,
      });

      return { success: true, simulated: false, method: "google_oauth" };
    } catch (err: any) {
      console.error("Google OAuth2 email dispatch failed, trying SMTP fallback:", err?.message || err);
    }
  }

  // 2. Gmail / Custom SMTP Transport
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
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
      from: process.env.EMAIL_FROM || smtpUser,
      to,
      subject,
      text: body,
      attachments,
    });

    return { success: true, simulated: false, method: "smtp" };
  }

  // 3. Fallback: Simulation Mode
  console.warn("No active Gmail OAuth or SMTP credentials found; simulating application email dispatch.");
  console.log(`[SIMULATED EMAIL] To: ${to}\nSubject: ${subject}\nBody:\n${body}\nAttachments: ${attachments?.map((a) => a.filename).join(", ") || "None"}`);
  return { success: true, simulated: true, method: "simulation" };
}
