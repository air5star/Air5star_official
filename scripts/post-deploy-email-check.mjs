#!/usr/bin/env node
import 'dotenv/config';
import nodemailer from 'nodemailer';

function presence(key, altKeys = []) {
  return !!(process.env[key] || altKeys.map(k => process.env[k]).find(Boolean));
}

function getArg(name) {
  const idx = process.argv.findIndex(a => a === name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  const pref = process.argv.find(a => a.startsWith(`${name}=`));
  return pref ? pref.split('=').slice(1).join('=') : '';
}

function buildTransport() {
  const port = parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587');
  const secure = port === 465 || String(process.env.BREVO_SMTP_SECURE || process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  const host = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const user = process.env.BREVO_SMTP_USER || process.env.SMTP_USER || process.env.BREVO_SMTP_USERNAME || '';
  const pass = process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASSWORD || process.env.BREVO_SMTP_PASS || '';
  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  return { transporter, host, port, secure, user };
}

async function main() {
  console.log('[PostDeployEmailCheck] Env presence:');
  const envSummary = {
    BREVO_SMTP_HOST: presence('BREVO_SMTP_HOST', ['SMTP_HOST']),
    BREVO_SMTP_PORT: presence('BREVO_SMTP_PORT', ['SMTP_PORT']),
    BREVO_SMTP_USER: presence('BREVO_SMTP_USER', ['SMTP_USER', 'BREVO_SMTP_USERNAME']),
    BREVO_SMTP_PASSWORD: presence('BREVO_SMTP_PASSWORD', ['SMTP_PASSWORD', 'BREVO_SMTP_PASS']),
    BREVO_FROM_EMAIL: presence('BREVO_FROM_EMAIL', ['SMTP_FROM_EMAIL']),
    BREVO_FROM_NAME: presence('BREVO_FROM_NAME', ['SMTP_FROM_NAME']),
    BREVO_SMTP_SECURE: presence('BREVO_SMTP_SECURE', ['SMTP_SECURE']),
    JWT_SECRET: presence('JWT_SECRET'),
    TEST_EMAIL: presence('TEST_EMAIL', ['EMAIL_TEST_RECIPIENT']),
  };
  console.log(envSummary);

  const { transporter, host, port, secure, user } = buildTransport();
  console.log('[PostDeployEmailCheck] Verifying SMTP…', { host, port, secure, user: !!user });

  try {
    await transporter.verify();
    console.log('[PostDeployEmailCheck] SMTP verified');
  } catch (err) {
    console.error('[PostDeployEmailCheck] SMTP verify failed:', err?.message || String(err));
    process.exit(1);
  }

  const cliTo = getArg('--to');
  const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_TEST_RECIPIENT || '';
  const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || '';
  const fromName = process.env.BREVO_FROM_NAME || process.env.SMTP_FROM_NAME || 'Air5Star';
  const smtpUser = user;

  const to = cliTo || testEmail || fromEmail || smtpUser || '';
  const redirectedToTestEmail = !!testEmail && !cliTo;
  const fromUsed = `${fromName} <${smtpUser || fromEmail}>`;

  const subject = 'Diagnostics: Email OTP Test';
  const html = `<!doctype html><html><body><h2>Diagnostics Email</h2><p>Your test OTP is <strong>123456</strong>.</p><p>This was sent to <code>${to}</code> from <code>${fromUsed}</code>.</p><p>Redirected to TEST_EMAIL: <strong>${redirectedToTestEmail}</strong></p></body></html>`;

  try {
    const info = await transporter.sendMail({ from: fromUsed, to, subject, html, ...(fromEmail ? { replyTo: fromEmail } : {}) });
    console.log('[PostDeployEmailCheck] Email sent', { messageId: info?.messageId, to, fromUsed, redirectedToTestEmail });
    console.log('[PostDeployEmailCheck] Deliverability hint: Ensure BREVO_FROM_EMAIL or SMTP user is a verified sender/domain in Brevo.');
    process.exit(0);
  } catch (err) {
    console.error('[PostDeployEmailCheck] Email send failed:', err?.message || String(err));
    process.exit(2);
  }
}

main().catch(err => {
  console.error('[PostDeployEmailCheck] Unexpected error:', err);
  process.exit(3);
});