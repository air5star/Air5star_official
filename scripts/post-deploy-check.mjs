import 'dotenv/config';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';

function presence(name) {
  return !!process.env[name];
}

function printEnvPresence() {
  const keys = [
    'BREVO_SMTP_HOST',
    'BREVO_SMTP_PORT',
    'BREVO_SMTP_USER',
    'BREVO_SMTP_PASSWORD',
    'BREVO_FROM_EMAIL',
    'JWT_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
  ];
  console.log('--- Env Presence ---');
  for (const key of keys) {
    console.log(`${key}: ${presence(key) ? 'SET' : 'MISSING'}`);
  }
}

async function verifySMTP() {
  console.log('\n--- SMTP Verify ---');
  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT || '587', 10),
    secure: (process.env.BREVO_SMTP_PORT || '587') === '465',
    auth: {
      user: process.env.BREVO_SMTP_USER || '',
      pass: process.env.BREVO_SMTP_PASSWORD || '',
    },
  });
  try {
    await transporter.verify();
    console.log('SMTP connectivity: OK');
    return true;
  } catch (err) {
    console.error('SMTP connectivity: FAILED', err?.message || err);
    return false;
  }
}

async function sendTestEmail() {
  console.log('\n--- Test Email Send ---');
  const shouldSend = String(process.env.DIAGNOSTICS_SEND_TEST_EMAIL || '').toLowerCase() === 'true';
  const to = process.env.EMAIL_TEST_RECIPIENT || process.env.BREVO_SMTP_USER || '';
  if (!shouldSend || !to) {
    console.log('Skipped (set DIAGNOSTICS_SEND_TEST_EMAIL=true and EMAIL_TEST_RECIPIENT)');
    return false;
  }
  try {
    // Lightweight send using EmailService would require TS runtime; use nodemailer directly
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587', 10),
      secure: (process.env.BREVO_SMTP_PORT || '587') === '465',
      auth: {
        user: process.env.BREVO_SMTP_USER || '',
        pass: process.env.BREVO_SMTP_PASSWORD || '',
      },
    });
    const from = process.env.BREVO_FROM_EMAIL || process.env.BREVO_SMTP_USER || '';
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Diagnostics: Email OTP Test',
      html: '<p>Your test OTP is <b>123456</b>. This is a diagnostics email.</p>',
    });
    console.log('Email send: OK', { messageId: info.messageId });
    return true;
  } catch (err) {
    console.error('Email send: FAILED', err?.message || err);
    return false;
  }
}

async function testRazorpayOrder() {
  console.log('\n--- Razorpay Order Test ---');
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      console.error('Missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET');
      return false;
    }
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({ amount: 100, currency: 'INR', receipt: `diag_${Date.now()}` });
    console.log('Razorpay order: OK', { orderId: order.id });
    return true;
  } catch (err) {
    console.error('Razorpay order: FAILED', err?.message || err);
    return false;
  }
}

async function main() {
  printEnvPresence();
  const results = {
    smtpVerified: await verifySMTP(),
    emailSendTest: await sendTestEmail(),
    razorpayOrder: await testRazorpayOrder(),
  };

  console.log('\n--- Summary ---');
  console.log(JSON.stringify(results, null, 2));

  const ok = results.smtpVerified && results.razorpayOrder;
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('Diagnostics script failed:', err);
  process.exit(1);
});