// lib/email.ts
import nodemailer from "nodemailer";

export async function sendApplicationEmail(params: {
  to: string;
  subject: string;
  body: string;
}) {
  const { to, subject, body } = params;

  if (!process.env.SMTP_HOST) {
    console.warn("SMTP not configured; skipping email send.");
    return;
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
    from: process.env.EMAIL_FROM ?? "no-reply@example.com",
    to,
    subject,
    text: body,
  });
}
