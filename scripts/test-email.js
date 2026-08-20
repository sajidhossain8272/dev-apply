const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = (process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || '').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD || '').replace(/\s+/g, '');
  const targetEmail = 'sajidhossain8272@gmail.com';
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  console.log(`[TEST] Sender: ${user}`);
  console.log(`[TEST] Recipient: ${targetEmail}`);
  console.log(`[TEST] Generated OTP: ${testOtp}`);

  // 1. Test Database OTP Storage
  console.log('\n--- Step 1: Testing Prisma OTP Token Database ---');
  await prisma.otpToken.deleteMany({ where: { email: targetEmail } });
  const createdRecord = await prisma.otpToken.create({
    data: {
      email: targetEmail,
      code: testOtp,
      expiresAt,
    },
  });
  console.log('[DB] OTP Token created in database:', createdRecord.id, 'Expires:', createdRecord.expiresAt);

  const foundRecord = await prisma.otpToken.findFirst({
    where: {
      email: targetEmail,
      code: testOtp,
      expiresAt: { gt: new Date() },
    },
  });
  if (!foundRecord) {
    throw new Error('Database lookup failed for OTP token');
  }
  console.log('[DB] Verification query lookup: MATCH CONFIRMED (Valid)');

  // 2. Test Gmail SMTP Dispatch
  console.log('\n--- Step 2: Testing Gmail SMTP Dispatch ---');
  if (!user || !pass) {
    throw new Error('Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });

  console.log('[SMTP] Verifying SMTP connection with Gmail...');
  await transporter.verify();
  console.log('[SMTP] SMTP Connection verified successfully!');

  console.log('[SMTP] Dispatching email...');
  const info = await transporter.sendMail({
    from: `"Dev-Apply Security" <${user}>`,
    to: targetEmail,
    subject: `Your Dev-Apply Verification Code: ${testOtp}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 30px; border-radius: 12px;">
        <h2 style="color: #10b981; margin-bottom: 8px;">Dev-Apply Account Security</h2>
        <p style="font-size: 14px; color: #a1a1aa;">Use the 6-digit verification code below to complete your sign-in or registration:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; color: #34d399; padding: 16px; display: inline-block; margin: 20px 0;">
          ${testOtp}
        </div>
        <p style="font-size: 12px; color: #71717a;">This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  console.log('[SMTP] Email successfully sent!');
  console.log(`[SMTP] Message ID: ${info.messageId}`);
  console.log(`[SMTP] Server Response: ${info.response}`);
  console.log(`\n========================================`);
  console.log(`✅ FULL TEST PASSED:`);
  console.log(`- Token generated & persisted in database`);
  console.log(`- Verification code ${testOtp} delivered to ${targetEmail}`);
  console.log(`========================================\n`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('[TEST ERROR]:', err);
  await prisma.$disconnect();
  process.exit(1);
});
