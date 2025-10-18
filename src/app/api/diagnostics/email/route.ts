import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { EmailService } from '@/lib/email';

// Restrict access: require a bearer token matching ADMIN_DIAGNOSTICS_TOKEN or JWT_SECRET
function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  const cookieToken = req.cookies.get('admin_token')?.value || '';
  const allowed = [
    process.env.ADMIN_DIAGNOSTICS_TOKEN || '',
    process.env.JWT_SECRET || '',
  ].filter(Boolean);
  return !!allowed.find(t => t === token || t === cookieToken);
}

function envPresenceSummary() {
  return {
    BREVO_SMTP_HOST: !!(process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST),
    BREVO_SMTP_PORT: !!(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT),
    BREVO_SMTP_USER: !!(process.env.BREVO_SMTP_USER || process.env.SMTP_USER || process.env.BREVO_SMTP_USERNAME),
    BREVO_SMTP_PASSWORD: !!(process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASSWORD || process.env.BREVO_SMTP_PASS),
    BREVO_FROM_EMAIL: !!(process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL),
    BREVO_FROM_NAME: !!(process.env.BREVO_FROM_NAME || process.env.SMTP_FROM_NAME),
    TEST_EMAIL: !!(process.env.TEST_EMAIL || process.env.EMAIL_TEST_RECIPIENT),
    BREVO_SMTP_SECURE: String(process.env.BREVO_SMTP_SECURE || process.env.SMTP_SECURE || '').length > 0,
    JWT_SECRET: !!process.env.JWT_SECRET,
  };
}

function buildTransport() {
  const port = parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587');
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port,
    secure: port === 465 || String(process.env.BREVO_SMTP_SECURE || process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.BREVO_SMTP_USER || process.env.SMTP_USER || process.env.BREVO_SMTP_USERNAME || '',
      pass: process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASSWORD || process.env.BREVO_SMTP_PASS || '',
    },
  });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const forcedTo = url.searchParams.get('to') || '';
  const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_TEST_RECIPIENT || '';
  const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || '';
  const smtpUser = process.env.BREVO_SMTP_USER || process.env.SMTP_USER || process.env.BREVO_SMTP_USERNAME || '';
  const fromName = process.env.BREVO_FROM_NAME || process.env.SMTP_FROM_NAME || 'Air5Star';
  const fromUsed = `${fromName} <${smtpUser || fromEmail}>`;

  const redirectedToTestEmail = !!testEmail;
  const recipient = forcedTo || testEmail || fromEmail || smtpUser || '';

  // 1) Verify SMTP via EmailService transporter
  const es = new EmailService();
  let smtpVerified = false;
  let verifyError: string | undefined;
  try {
    const verify = await es.verifyTransport();
    smtpVerified = verify.ok;
    verifyError = verify.error;
  } catch (err: any) {
    smtpVerified = false;
    verifyError = err?.message || String(err);
  }

  // 2) Attempt test send (diagnostics)
  let emailSent = false;
  let messageId: string | undefined;
  let sendError: string | undefined;

  try {
    const info = await es.sendVerificationEmailWithInfo(recipient, 'Diagnostics', '654321');
    emailSent = info.sent;
    messageId = info.messageId;
    // prefer fromUsed from info to reflect EmailService decision
  } catch (err: any) {
    emailSent = false;
    sendError = err?.message || String(err);
  }

  const deliverabilityHint = 'Ensure BREVO_FROM_EMAIL or SMTP user is a verified sender/domain in Brevo.';

  return NextResponse.json({
    smtpVerified,
    error: verifyError,
    emailSent,
    messageId,
    sendError,
    fromUsed,
    redirectedToTestEmail,
    envPresence: envPresenceSummary(),
    deliverabilityHint,
    recipient,
    timestamp: new Date().toISOString(),
  });
}