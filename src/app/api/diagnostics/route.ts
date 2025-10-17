import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import { EmailService } from '@/lib/email';

function envPresence() {
  const required = {
    BREVO_SMTP_HOST: !!process.env.BREVO_SMTP_HOST,
    BREVO_SMTP_PORT: !!process.env.BREVO_SMTP_PORT,
    BREVO_SMTP_USER: !!process.env.BREVO_SMTP_USER,
    BREVO_SMTP_PASSWORD: !!process.env.BREVO_SMTP_PASSWORD,
    BREVO_FROM_EMAIL: !!process.env.BREVO_FROM_EMAIL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  };
  return required;
}

async function verifySMTP(): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587', 10),
      secure: (process.env.BREVO_SMTP_PORT || '587') === '465',
      auth: {
        user: process.env.BREVO_SMTP_USER || '',
        pass: process.env.BREVO_SMTP_PASSWORD || '',
      },
    });
    await transporter.verify();
    return true;
  } catch (err) {
    console.error('[Diagnostics] SMTP verify failed:', err);
    return false;
  }
}

async function testEmailSend(): Promise<boolean> {
  try {
    const shouldSend = String(process.env.DIAGNOSTICS_SEND_TEST_EMAIL || '').toLowerCase() === 'true';
    const testRecipient = process.env.EMAIL_TEST_RECIPIENT || process.env.BREVO_SMTP_USER || '';
    if (!shouldSend || !testRecipient) return false;
    const emailService = new EmailService();
    const sent = await emailService.sendVerificationEmail(testRecipient, 'Diagnostics', '654321');
    return !!sent;
  } catch (err) {
    console.error('[Diagnostics] Email send test failed:', err);
    return false;
  }
}

async function testRazorpayOrder(): Promise<{ canCreateOrder: boolean; orderId?: string; error?: string; clientKeySet: boolean }> {
  const clientKeySet = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return { canCreateOrder: false, error: 'Missing server keys', clientKeySet };
    }
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({ amount: 100, currency: 'INR', receipt: `diag_${Date.now()}` });
    return { canCreateOrder: true, orderId: order.id, clientKeySet };
  } catch (err: any) {
    console.error('[Diagnostics] Razorpay order creation failed:', err);
    return { canCreateOrder: false, error: err?.message || 'Unknown error', clientKeySet };
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const requiredToken = process.env.ADMIN_DIAGNOSTICS_TOKEN || process.env.JWT_SECRET || '';
    if (!token || token !== requiredToken) {
      return NextResponse.json({ error: 'Unauthorized diagnostics access' }, { status: 401 });
    }

    const env = envPresence();
    const smtpVerified = await verifySMTP();
    const emailSendTest = await testEmailSend();
    const razorpay = await testRazorpayOrder();

    return NextResponse.json({
      env,
      smtpVerified,
      emailSendTest,
      razorpay,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Diagnostics] Endpoint failed:', err);
    return NextResponse.json({ error: 'Diagnostics failed' }, { status: 500 });
  }
}