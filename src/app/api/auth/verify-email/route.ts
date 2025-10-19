import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateToken } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email';

// Validation schema for email verification
const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Validation schema for resending OTP
const resendOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Rate limiting map for verification attempts
const verificationAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_VERIFICATION_ATTEMPTS = 5;
const VERIFICATION_WINDOW = 15 * 60 * 1000; // 15 minutes

// Rate limiting map for resend attempts
const resendAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_RESEND_ATTEMPTS = 3;
const RESEND_WINDOW = 60 * 60 * 1000; // 1 hour

// POST /api/auth/verify-email - Verify email with OTP
export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP for verification attempts
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const now = Date.now();
    const attempts = verificationAttempts.get(clientIP);
    
    if (attempts) {
      if (now - attempts.lastAttempt < VERIFICATION_WINDOW) {
        if (attempts.count >= MAX_VERIFICATION_ATTEMPTS) {
          return NextResponse.json(
            { error: 'Too many verification attempts. Please try again later.' },
            { status: 429 }
          );
        }
        attempts.count++;
        attempts.lastAttempt = now;
      } else {
        // Reset if window expired
        verificationAttempts.set(clientIP, { count: 1, lastAttempt: now });
      }
    } else {
      verificationAttempts.set(clientIP, { count: 1, lastAttempt: now });
    }

    const body = await request.json();
    const validatedData = verifyEmailSchema.parse(body);
    const { email, otp } = validatedData;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user with matching email and OTP
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        emailVerificationOTP: otp,
        emailVerificationExpiry: {
          gt: new Date(), // OTP not expired
        },
        isEmailVerified: false, // Not already verified
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        provider: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Mark user as verified and clear OTP data
    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationOTP: null,
        emailVerificationExpiry: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        provider: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate JWT token for the verified user
    const token = await generateToken(verifiedUser.id, verifiedUser.role, verifiedUser.email);

    return NextResponse.json({
      message: 'Email verified successfully',
      user: verifiedUser,
      token,
    }, { status: 200 });

  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/verify-email - Resend verification OTP
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting by IP for resend attempts
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const now = Date.now();
    const attempts = resendAttempts.get(clientIP);
    
    if (attempts) {
      if (now - attempts.lastAttempt < RESEND_WINDOW) {
        if (attempts.count >= MAX_RESEND_ATTEMPTS) {
          return NextResponse.json(
            { error: 'Too many resend attempts. Please try again later.' },
            { status: 429 }
          );
        }
        attempts.count++;
        attempts.lastAttempt = now;
      } else {
        // Reset if window expired
        resendAttempts.set(clientIP, { count: 1, lastAttempt: now });
      }
    } else {
      resendAttempts.set(clientIP, { count: 1, lastAttempt: now });
    }

    const body = await request.json();
    const validatedData = resendOTPSchema.parse(body);
    const { email } = validatedData;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find unverified user
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        isEmailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or already verified' },
        { status: 404 }
      );
    }

    // Generate new OTP
    const emailService = new EmailService();
    const otp = emailService.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Update user with new OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOTP: otp,
        emailVerificationExpiry: otpExpiry,
      },
    });

    // Send new verification email
    try {
      const sent = await emailService.sendVerificationEmail(user.email, user.name, otp);
      if (!sent) {
        throw new Error('Email send returned false');
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification code sent successfully',
    }, { status: 200 });

  } catch (error) {
    console.error('Resend OTP error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}