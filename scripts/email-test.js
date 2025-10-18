// Quick SMTP diagnostics using Brevo envs from .cloudrun.env
// Usage: node scripts/email-test.js [recipient]

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

function loadEnvFromFile(envPath) {
  if (!fs.existsSync(envPath)) {
    console.log(`[email-test] Env file not found: ${envPath}`);
    return;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    process.env[key] = val;
  }
}

(async function main() {
  const envPath = path.resolve(__dirname, '..', '.cloudrun.env');
  loadEnvFromFile(envPath);

  const port = parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587', 10);
  const host = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const user = process.env.BREVO_SMTP_USER || process.env.SMTP_USER || process.env.BREVO_SMTP_USERNAME || '';
  const pass = process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASSWORD || process.env.BREVO_SMTP_PASS || '';
  const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || '';
  const fromName = process.env.BREVO_FROM_NAME || process.env.SMTP_FROM_NAME || 'Air5Star';
  const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_TEST_RECIPIENT || '';

  const recipientArg = process.argv[2];
  const recipient = recipientArg || testEmail || fromEmail || user || '';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || String(process.env.BREVO_SMTP_SECURE || process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: { user, pass },
  });

  console.log('[email-test] Transport config:', { host, port, secure: port === 465, user });

  try {
    await transporter.verify();
    console.log('[email-test] SMTP verify: OK');
  } catch (err) {
    console.error('[email-test] SMTP verify: FAILED', err && err.message ? err.message : err);
  }

  const fromAddress = fromEmail || (user.includes('@') ? user : '');
  const fromHeader = `${fromName} <${fromAddress}>`;

  try {
    const info = await transporter.sendMail({
      from: fromHeader,
      to: recipient,
      subject: 'Air5Star SMTP Diagnostics',
      html: '<p>This is a test email from the SMTP diagnostics script.</p>',
      ...(fromEmail ? { replyTo: fromEmail } : {}),
    });
    console.log('[email-test] SendMail: OK', { messageId: info.messageId, to: recipient, from: fromHeader });
  } catch (err) {
    console.error('[email-test] SendMail: FAILED', err && err.message ? err.message : err);
  }
})();