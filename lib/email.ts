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

  // 1. Direct Gmail REST API Dispatch (Using user's Google OAuth Access Token)
  if (userGmailCredentials?.accessToken) {
    try {
      const fromEmail = userGmailCredentials.email || "me";

      // Compile raw RFC822 MIME message with attachments
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
      console.error("Gmail REST API dispatch failed, trying fallbacks:", err?.message || err);
    }
  }

  // 2. Nodemailer Google OAuth2 Transport
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
      console.error("Google OAuth2 transport failed, trying SMTP fallback:", err?.message || err);
    }
  }

  // 3. Gmail / Custom SMTP Transport
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

  // 4. Fallback: Simulation Mode
  console.warn("No active Gmail OAuth or SMTP credentials found; simulating application email dispatch.");
  console.log(
    `[SIMULATED EMAIL] To: ${to}\nSubject: ${subject}\nBody:\n${body}\nAttachments: ${
      attachments?.map((a) => a.filename).join(", ") || "None"
    }`
  );
  return { success: true, simulated: true, method: "simulation", requiresGoogleAuth: true };
}
