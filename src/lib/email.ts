import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface OrderConfirmationData {
  orderId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  shippingCost?: number;
  discount?: number;
  estimatedDelivery: string;
  shippingAddress: string;
  transactionId?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;
  private testEmail: string;
  private smtpUser: string;

  constructor() {
    const port = parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587');
    const config: EmailConfig = {
      host: process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port,
      secure: port === 465 || String(process.env.BREVO_SMTP_SECURE || process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      auth: {
        user: process.env.BREVO_SMTP_USER || process.env.SMTP_USER || process.env.BREVO_SMTP_USERNAME || '',
        pass: process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASSWORD || process.env.BREVO_SMTP_PASS || '',
      },
    };

    this.fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || '';
    this.fromName = process.env.BREVO_FROM_NAME || process.env.SMTP_FROM_NAME || 'Air5Star';
    this.testEmail = process.env.TEST_EMAIL || '';
    this.smtpUser = config.auth.user;
    
    this.transporter = nodemailer.createTransport(config);

    this.transporter.verify()
      .then(() => {
        console.log('[EmailService] SMTP verified:', {
          host: config.host,
          port: config.port,
          secure: (this.transporter as any)?.options?.secure ?? config.secure,
          user: this.smtpUser,
          from: this.fromEmail || (this.smtpUser?.includes('@') ? this.smtpUser : ''),
          testRedirect: !!this.testEmail,
        });
      })
      .catch((err) => {
        console.error('[EmailService] SMTP verify failed:', err);
      });
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const recipient = this.testEmail || options.to;
      const fromAddress = this.fromEmail || options.from || (this.smtpUser && this.smtpUser.includes('@') ? this.smtpUser : '');
      const fromHeader = `${this.fromName} <${fromAddress}>`;
      
      const mailOptions = {
        from: fromHeader,
        to: recipient,
        subject: options.subject,
        html: options.html,
        ...(this.fromEmail ? { replyTo: this.fromEmail } : {}),
      };

      console.log('[EmailService] Sending email', {
        to: mailOptions.to,
        from: mailOptions.from,
        replyTo: (mailOptions as any).replyTo,
        subject: mailOptions.subject,
        host: (this.transporter as any)?.options?.host,
        user: this.smtpUser,
        testRedirect: !!this.testEmail,
      });

      const result = await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] Email sent successfully:', {
        messageId: result.messageId,
        response: (result as any)?.response,
      });
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send email:', {
        error: (error as any)?.message || error,
        code: (error as any)?.code,
      });
      return false;
    }
  }

  async sendVerificationEmail(email: string, name: string, otp: string): Promise<boolean> {
    const subject = 'Verify Your Email - Air5Star';
    const html = this.generateVerificationEmailHTML(name, otp);
    
    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendOrderConfirmationEmail(email: string, orderData: OrderConfirmationData): Promise<boolean> {
    const subject = `Order Confirmation - ${orderData.orderId}`;
    const html = this.generateOrderConfirmationHTML(orderData);
    
    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, resetLink: string): Promise<boolean> {
    const subject = 'Reset Your Password - Air5Star';
    const html = this.generatePasswordResetEmailHTML(name, resetLink);
    
    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  private generateVerificationEmailHTML(name: string, otp: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .otp-box {
                background: #f8fafc;
                border: 2px dashed #2563eb;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
                border-radius: 8px;
            }
            .otp-code {
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 2px;
                color: #1f2937;
            }
            .info {
                background: #eff6ff;
                padding: 15px;
                border-radius: 8px;
                margin-top: 20px;
                color: #1f2937;
            }
            .cta-button {
                display: inline-block;
                padding: 12px 24px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 20px;
            }
            .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #6b7280;
                text-align: center;
            }
            .warning {
                background: #fff7ed;
                color: #b45309;
                padding: 12px;
                border-radius: 8px;
                margin-top: 20px;
                border: 1px solid #fed7aa;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Air5Star</div>
                <div>Welcome to Air5Star!</div>
            </div>
            <p>Hello ${name},</p>
            <p>Thank you for signing up. Please use the following verification code to confirm your email address:</p>
            <div class="otp-box">
                <div class="otp-code">${otp}</div>
            </div>
            <p class="info">This code is valid for <strong>10 minutes</strong>. If you didn't request this, please ignore this email.</p>
            <p>Once verified, you can access your account and enjoy exclusive offers.</p>
            <div class="footer">
                <p>Best regards,<br>The Air5Star Team</p>
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateOrderConfirmationHTML(orderData: OrderConfirmationData): string {
    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">₹${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; border-bottom: 1px solid #eee; }
            th { background: #f8fafc; }
            .total { font-size: 18px; font-weight: bold; text-align: right; }
            .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
            .address { background: #f8fafc; padding: 15px; border-radius: 8px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Air5Star</div>
                <div>Thank you for your purchase!</div>
            </div>
            <p>Hello ${orderData.customerName},</p>
            <p>Your order <strong>${orderData.orderId}</strong> has been confirmed. Here are the details:</p>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th style="text-align:center">Qty</th>
                        <th style="text-align:right">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <p class="total">Total: ₹${orderData.totalAmount.toFixed(2)}</p>
            ${orderData.shippingAddress ? `<div class="address"><strong>Shipping Address:</strong><br/>${orderData.shippingAddress}</div>` : ''}
            ${orderData.estimatedDelivery ? `<p>Estimated Delivery: ${orderData.estimatedDelivery}</p>` : ''}
            ${orderData.transactionId ? `<p>Transaction ID: ${orderData.transactionId}</p>` : ''}
            <div class="footer">
                <p>We hope you enjoy your purchase!</p>
                <p>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generatePasswordResetEmailHTML(name: string, resetLink: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .info { background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px; color: #1f2937; }
            .cta-button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
            .warning { background: #fff7ed; color: #b45309; padding: 12px; border-radius: 8px; margin-top: 20px; border: 1px solid #fed7aa; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Air5Star</div>
                <div>Password Reset Request</div>
            </div>
            <p>Hello ${name},</p>
            <p>We received a request to reset your password. Click the button below to proceed:</p>
            <p><a href="${resetLink}" class="cta-button">Reset Password</a></p>
            <p class="info">If you did not request a password reset, please ignore this email.</p>
            <div class="footer">
                <p>Air5Star Support</p>
                <p>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  getEnvPresence(): { BREVO_SMTP_HOST: boolean; BREVO_SMTP_PORT: boolean; BREVO_SMTP_USER: boolean; BREVO_SMTP_PASSWORD: boolean; BREVO_FROM_EMAIL: boolean; BREVO_FROM_NAME: boolean; TEST_EMAIL: boolean; BREVO_SMTP_SECURE: boolean } {
    return {
      BREVO_SMTP_HOST: !!(process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST),
      BREVO_SMTP_PORT: !!(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT),
      BREVO_SMTP_USER: !!(process.env.BREVO_SMTP_USER || process.env.SMTP_USER || process.env.BREVO_SMTP_USERNAME),
      BREVO_SMTP_PASSWORD: !!(process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASSWORD || process.env.BREVO_SMTP_PASS),
      BREVO_FROM_EMAIL: !!(process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL),
      BREVO_FROM_NAME: !!(process.env.BREVO_FROM_NAME || process.env.SMTP_FROM_NAME),
      TEST_EMAIL: !!(process.env.TEST_EMAIL),
      BREVO_SMTP_SECURE: String(process.env.BREVO_SMTP_SECURE || process.env.SMTP_SECURE || '').length > 0,
    };
  }
  getEffectiveFrom(): string {
    const fromAddress = this.fromEmail || (this.smtpUser && this.smtpUser.includes('@') ? this.smtpUser : '');
    return `${this.fromName} <${fromAddress}>`;
  }
  isRedirectingToTest(): boolean {
    return !!(this.testEmail);
  }
  async verifyTransport(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.transporter.verify();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || String(err) };
    }
  }
  async sendVerificationEmailWithInfo(email: string, name: string, otp: string): Promise<{ sent: boolean; messageId?: string; fromUsed: string; redirectedToTestEmail: boolean; recipientUsed: string; error?: string }> {
    const subject = 'Verify Your Email - Air5Star';
    const html = this.generateVerificationEmailHTML(name, otp);
    const recipient = this.testEmail || email;
    const redirected = !!this.testEmail;
    const fromAddress = this.fromEmail || (this.smtpUser && this.smtpUser.includes('@') ? this.smtpUser : '');
    const fromHeader = `${this.fromName} <${fromAddress}>`;

    try {
      const info = await this.transporter.sendMail({
        from: fromHeader,
        to: recipient,
        subject,
        html,
        ...(this.fromEmail ? { replyTo: this.fromEmail } : {}),
      });
      return { sent: true, messageId: (info as any)?.messageId, fromUsed: fromHeader, redirectedToTestEmail: redirected, recipientUsed: recipient };
    } catch (error: any) {
      return { sent: false, error: error?.message || String(error), fromUsed: fromHeader, redirectedToTestEmail: redirected, recipientUsed: recipient };
    }
  }
}

export const emailService = new EmailService();
export default emailService;