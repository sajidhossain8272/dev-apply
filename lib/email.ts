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
}) {
  const { to, subject, body, attachments } = params;

  if (!process.env.SMTP_HOST) {
    console.warn("SMTP not configured; simulating email send in console.");
    console.log(`[SIMULATED EMAIL] To: ${to}\nSubject: ${subject}\nBody:\n${body}\nAttachments: ${attachments?.map(a => a.filename).join(", ") || "None"}`);
    return { success: true, simulated: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? "no-reply@example.com",
    to,
    subject,
    text: body,
    attachments,
  });

  return { success: true, simulated: false };
}
