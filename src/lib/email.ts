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
      secure: port === 465 || String(process.env.BREVO_SMTP_SECURE || process.env.SMTP_SECURE || '').toLowerCase() === 'true', // Use secure for port 465 or explicit secure flag; otherwise STARTTLS on 587/25
      auth: {
        user: process.env.BREVO_SMTP_USER || process.env.SMTP_USER || process.env.BREVO_SMTP_USERNAME || '',
        pass: process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASSWORD || process.env.BREVO_SMTP_PASS || '',
      },
    };

    this.fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || '';
    this.fromName = process.env.BREVO_FROM_NAME || process.env.SMTP_FROM_NAME || 'Air5Star';
    this.testEmail = process.env.TEST_EMAIL || process.env.EMAIL_TEST_RECIPIENT || '';
    this.smtpUser = config.auth.user;
    
    this.transporter = nodemailer.createTransport(config);

    // Quick connectivity check (non-blocking)
    this.transporter.verify()
      .then(() => {
        console.log('[EmailService] SMTP verified:', {
          host: config.host,
          port: config.port,
          secure: (this.transporter as any)?.options?.secure ?? config.secure,
          user: this.smtpUser,
          from: this.fromEmail || this.smtpUser,
          testRedirect: !!this.testEmail,
        });
      })
      .catch((err) => {
        console.error('[EmailService] SMTP verify failed:', err);
      });
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // In testing mode, send all emails to test email
      const recipient = this.testEmail || options.to;
      // Prefer SMTP user as sender to avoid unverified domain delivery issues
      const fromAddress = this.smtpUser || this.fromEmail || options.from || '';
      const fromHeader = `${this.fromName} <${fromAddress}>`;
      
      const mailOptions = {
        // Always use SMTP user for the actual sender; use brand name
        from: fromHeader,
        to: recipient,
        subject: options.subject,
        html: options.html,
        // Use brand address for replies, if available
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
                color: #2563eb;
                letter-spacing: 8px;
                margin: 10px 0;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            .warning {
                background: #fef2f2;
                border-left: 4px solid #ef4444;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Air5Star</div>
                <h1>Email Verification</h1>
            </div>
            
            <p>Hello ${name || 'Valued Customer'},</p>
            
            <p>Thank you for signing up with Air5Star! To complete your registration and secure your account, please verify your email address using the verification code below:</p>
            
            <div class="otp-box">
                <p style="margin: 0; font-size: 16px; color: #666;">Your Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; font-size: 14px; color: #666;">Valid for 10 minutes</p>
            </div>
            
            <p>Enter this code on the verification page to activate your account and start shopping for premium HVAC products.</p>
            
            <div class="warning">
                <strong>Security Note:</strong> This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </div>
            
            <p>If you have any questions or need assistance, feel free to contact our support team.</p>
            
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
    const itemsHTML = orderData.items.map(item => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #eee;">
          <div style="display: flex; align-items: center;">
            ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">` : ''}
            <div>
              <h4 style="margin: 0 0 5px 0; color: #333;">${item.name}</h4>
              <p style="margin: 0; color: #666; font-size: 14px;">Quantity: ${item.quantity}</p>
            </div>
          </div>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
          ₹${(item.price * item.quantity).toLocaleString()}
        </td>
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
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .content {
                padding: 30px;
            }
            .order-info {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .order-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .order-table th {
                background: #f1f5f9;
                padding: 15px;
                text-align: left;
                font-weight: 600;
                color: #475569;
            }
            .total-row {
                background: #f8fafc;
                font-weight: bold;
                font-size: 18px;
            }
            .footer {
                background: #f8fafc;
                padding: 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            .status-badge {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Air5Star</div>
                <h1>Order Confirmation</h1>
                <div class="status-badge">Order Confirmed</div>
            </div>
            
            <div class="content">
                <p>Dear ${orderData.customerName},</p>
                
                <p>Thank you for your order! We're excited to confirm that your order has been successfully placed and is being processed.</p>
                
                <div class="order-info">
                    <h3 style="margin-top: 0; color: #2563eb;">Order Details</h3>
                    <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                    <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    <p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>
                    ${orderData.transactionId ? `<p><strong>Payment ID:</strong> ${orderData.transactionId}</p>` : ''}
                    <p><strong>Shipping Address:</strong><br>${orderData.shippingAddress}</p>
                </div>
                
                <h3 style="color: #2563eb;">Items Ordered</h3>
                <table class="order-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style="text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHTML}
                    <tr>
                      <td colspan="2" style="padding: 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="padding: 12px; color: #475569;">Subtotal</td>
                              <td style="padding: 12px; text-align: right; color: #0f172a;">₹${(orderData.subtotal ?? orderData.totalAmount).toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td style="padding: 12px; color: #475569;">Shipping</td>
                              <td style="padding: 12px; text-align: right; color: #0f172a;">${(orderData.shippingCost ?? 0) === 0 ? '<span style="color:#16a34a; font-weight:600;">FREE</span>' : `₹${(orderData.shippingCost ?? 0).toLocaleString()}`}</td>
                            </tr>
                            <tr>
                              <td style="padding: 12px; color: #475569;">Tax (GST)</td>
                              <td style="padding: 12px; text-align: right; color: #0f172a;">₹${(orderData.tax ?? 0).toLocaleString()}</td>
                            </tr>
                            ${orderData.discount && orderData.discount > 0 ? `
                            <tr>
                              <td style="padding: 12px; color: #16a34a;">Discount</td>
                              <td style="padding: 12px; text-align: right; color: #16a34a;">-₹${orderData.discount.toLocaleString()}</td>
                            </tr>
                            ` : ''}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr class="total-row">
                      <td style="padding: 20px; border-top: 2px solid #2563eb;">
                        <strong>Total Amount</strong>
                      </td>
                      <td style="padding: 20px; text-align: right; border-top: 2px solid #2563eb; color: #2563eb;">
                        <strong>₹${orderData.totalAmount.toLocaleString()}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0; border-radius: 4px;">
                    <h4 style="margin-top: 0; color: #2563eb;">What's Next?</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Your order is being prepared for shipment</li>
                        <li>You'll receive tracking information once shipped</li>
                        <li>Expected delivery: ${orderData.estimatedDelivery}</li>
                    </ul>
                </div>
                
                <p>If you have any questions about your order, please don't hesitate to contact our customer support team.</p>
            </div>
            
            <div class="footer">
                <p><strong>Thank you for choosing Air5Star!</strong></p>
                <p>Your trusted partner for premium HVAC solutions</p>
                <p style="margin-top: 20px;">This is an automated email. Please do not reply to this message.</p>
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
                margin-bottom: 20px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 6px;
            }
            .cta-button {
                display: inline-block;
                background: #2563eb;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            .warning {
                background: #fef2f2;
                border-left: 4px solid #ef4444;
                padding: 12px;
                border-radius: 6px;
                margin-top: 14px;
                color: #7f1d1d;
            }
            .link-box {
                background: #f8fafc;
                border: 1px solid #e5e7eb;
                padding: 12px;
                border-radius: 8px;
                word-break: break-all;
                font-size: 13px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Air5Star</div>
                <h1>Reset your password</h1>
            </div>
            <p>Hi ${name || 'there'},</p>
            <p>We received a request to reset your password. Click the button below to set a new password. This link is valid for the next <strong>1 hour</strong>.</p>
            <p style="text-align:center;">
              <a href="${resetLink}" class="cta-button">Reset Password</a>
            </p>
            <p>If the button doesn’t work, copy and paste this link into your browser:</p>
            <div class="link-box">${resetLink}</div>
            <div class="warning">
              If you didn’t request a password reset, you can safely ignore this email.
            </div>
            <div class="footer">
                <p>Air5Star Support</p>
                <p>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generate a random 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Calculate OTP expiration time (10 minutes from now)
  getOTPExpiration(): Date {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 10);
    return expiration;
  }

  getEnvPresence(): { BREVO_SMTP_HOST: boolean; BREVO_SMTP_PORT: boolean; BREVO_SMTP_USER: boolean; BREVO_SMTP_PASSWORD: boolean; BREVO_FROM_EMAIL: boolean; BREVO_FROM_NAME: boolean; TEST_EMAIL: boolean; BREVO_SMTP_SECURE: boolean } {
    return {
      BREVO_SMTP_HOST: !!(process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST),
      BREVO_SMTP_PORT: !!(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT),
      BREVO_SMTP_USER: !!(process.env.BREVO_SMTP_USER || process.env.SMTP_USER || process.env.BREVO_SMTP_USERNAME),
      BREVO_SMTP_PASSWORD: !!(process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASSWORD || process.env.BREVO_SMTP_PASS),
      BREVO_FROM_EMAIL: !!(process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL),
      BREVO_FROM_NAME: !!(process.env.BREVO_FROM_NAME || process.env.SMTP_FROM_NAME),
      TEST_EMAIL: !!(process.env.TEST_EMAIL || process.env.EMAIL_TEST_RECIPIENT),
      BREVO_SMTP_SECURE: String(process.env.BREVO_SMTP_SECURE || process.env.SMTP_SECURE || '').length > 0,
    };
  }
  getEffectiveFrom(): string {
    const fromAddress = this.smtpUser || this.fromEmail || '';
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
  async sendVerificationEmailWithInfo(email: string, name: string, otp: string): Promise<{ sent: boolean; messageId?: string; fromUsed: string; redirectedToTestEmail: boolean; error?: string }> {
    const subject = 'Verify Your Email - Air5Star';
    const html = this.generateVerificationEmailHTML(name, otp);
    const recipient = this.testEmail || email;
    const redirected = !!this.testEmail;
    const fromAddress = this.smtpUser || this.fromEmail || '';
    const fromHeader = `${this.fromName} <${fromAddress}>`;

    try {
      const info = await this.transporter.sendMail({
        from: fromHeader,
        to: recipient,
        subject,
        html,
        ...(this.fromEmail ? { replyTo: this.fromEmail } : {}),
      });
      return { sent: true, messageId: (info as any)?.messageId, fromUsed: fromHeader, redirectedToTestEmail: redirected };
    } catch (error: any) {
      return { sent: false, error: error?.message || String(error), fromUsed: fromHeader, redirectedToTestEmail: redirected };
    }
  }
}

export const emailService = new EmailService();
export default emailService;