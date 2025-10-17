import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { hashPassword } from '@/lib/auth-utils';
import { signupSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email';

// Rate limiting map
const signupAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_SIGNUP_ATTEMPTS = 5;
const SIGNUP_WINDOW = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const now = Date.now();
    const attempts = signupAttempts.get(clientIP);
    
    if (attempts) {
      if (now - attempts.lastAttempt < SIGNUP_WINDOW) {
        if (attempts.count >= MAX_SIGNUP_ATTEMPTS) {
          return NextResponse.json(
            { error: 'Too many signup attempts. Please try again later.' },
            { status: 429 }
          );
        }
        attempts.count++;
        attempts.lastAttempt = now;
      } else {
        // Reset if window expired
        signupAttempts.set(clientIP, { count: 1, lastAttempt: now });
      }
    } else {
      signupAttempts.set(clientIP, { count: 1, lastAttempt: now });
    }

    const body = await request.json();
    
    // Validate input data
    const validatedData = signupSchema.parse(body);
    const { name, email, password, phone } = validatedData;

    // Normalize inputs
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name.trim();
    const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;

    // Check if user already exists in DB (case-insensitive email)
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isEmailVerified: true, name: true, email: true },
    });

    if (existingEmailUser) {
      // If the account exists but is not verified, resend OTP instead of blocking
      if (!existingEmailUser.isEmailVerified) {
        const emailService = new EmailService();
        const otp = emailService.generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.user.update({
          where: { id: existingEmailUser.id },
          data: {
            emailVerificationOTP: otp,
            emailVerificationExpiry: otpExpiry,
          },
        });

        try {
          await emailService.sendVerificationEmail(
            existingEmailUser.email!,
            existingEmailUser.name || 'Customer',
            otp
          );
        } catch (emailError) {
          console.error('[Signup] Failed to resend verification email:', {
            email: existingEmailUser.email,
            error: (emailError as any)?.message || emailError,
          });
        }

        return NextResponse.json({
          message: 'Account exists but not verified. We sent a new verification code to your email.',
          requiresVerification: true,
        }, { status: 200 });
      }

      // Otherwise, a verified account exists
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if phone number is already in use (if provided)
    if (normalizedPhone) {
      const existingPhoneUser = await prisma.user.findFirst({
        where: { phone: normalizedPhone },
        select: { id: true },
      });
      
      if (existingPhoneUser) {
        return NextResponse.json(
          { error: 'User with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate OTP for email verification
    const emailService = new EmailService();
    const otp = emailService.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Persist new user in PostgreSQL via Prisma (unverified)
    const createdUser = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        phone: normalizedPhone,
        role: 'USER',
        isActive: true,
        provider: 'credentials',
        isEmailVerified: false,
        emailVerificationOTP: otp,
        emailVerificationExpiry: otpExpiry,
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

    // Send verification email
    try {
      const sent = await emailService.sendVerificationEmail(normalizedEmail, normalizedName, otp);
      if (!sent) {
        console.error('[Signup] Verification email not sent', {
          email: normalizedEmail,
          name: normalizedName,
          reason: 'sendEmail returned false',
        });
      }
    } catch (emailError) {
      console.error('[Signup] Failed to send verification email:', {
        email: normalizedEmail,
        name: normalizedName,
        error: (emailError as any)?.message || emailError,
      });
      // Don't fail the signup if email fails, but log it
    }

    return NextResponse.json({
      message: 'User registered successfully. Please check your email for verification code.',
      user: createdUser,
      requiresVerification: true,
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);

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

    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error('Prisma initialization error during signup:', {
        message: error.message,
        errorCode: error.errorCode,
      });
      return NextResponse.json(
        { error: 'Database connection failed. Please try again shortly.' },
        { status: 500 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma known request error during signup:', {
        code: error.code,
        message: error.message,
        meta: error.meta,
      });
      if (error.code === 'P2002') {
        // Unique constraint
        return NextResponse.json(
          { error: 'Account already exists for provided details' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Database operation failed. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}