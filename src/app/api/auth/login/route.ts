import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword, generateToken } from '@/lib/auth-utils';
import { loginSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';

// Rate limiting map
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil?: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const now = Date.now();
    const attempts = loginAttempts.get(clientIP);
    
    // Check if IP is currently blocked
    if (attempts?.blockedUntil && now < attempts.blockedUntil) {
      const remainingTime = Math.ceil((attempts.blockedUntil - now) / 60000);
      return NextResponse.json(
        { error: `Too many failed login attempts. Try again in ${remainingTime} minutes.` },
        { status: 429 }
      );
    }
    
    // Update or initialize attempt tracking
    if (attempts) {
      if (now - attempts.lastAttempt < LOGIN_WINDOW) {
        if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
          // Block the IP
          attempts.blockedUntil = now + BLOCK_DURATION;
          return NextResponse.json(
            { error: 'Too many failed login attempts. Account temporarily blocked.' },
            { status: 429 }
          );
        }
      } else {
        // Reset if window expired
        loginAttempts.set(clientIP, { count: 0, lastAttempt: now });
      }
    } else {
      loginAttempts.set(clientIP, { count: 0, lastAttempt: now });
    }

    const body = await request.json();
    
    // Validate input data
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email from database
    const dbUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!dbUser || dbUser.isActive === false) {
      // Increment failed attempts
      const currentAttempts = loginAttempts.get(clientIP);
      if (currentAttempts) {
        currentAttempts.count++;
        currentAttempts.lastAttempt = now;
      }
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!dbUser.isEmailVerified) {
      return NextResponse.json(
        { 
          error: 'Email not verified. Please verify your email before logging in.',
          requiresVerification: true,
          email: dbUser.email
        },
        { status: 403 }
      );
    }

    // Verify password (ensure credentials login available)
    if (!dbUser.password) {
      const currentAttempts = loginAttempts.get(clientIP);
      if (currentAttempts) {
        currentAttempts.count++;
        currentAttempts.lastAttempt = now;
      }
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, dbUser.password);
    
    if (!isValidPassword) {
      // Increment failed attempts
      const currentAttempts = loginAttempts.get(clientIP);
      if (currentAttempts) {
        currentAttempts.count++;
        currentAttempts.lastAttempt = now;
      }
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Reset failed attempts on successful login
    loginAttempts.delete(clientIP);

    // Generate JWT token
    const token = await generateToken(dbUser.id, dbUser.role, dbUser.email);

    // Return success response (exclude password)
    const { password: _, ...userWithoutPassword } = dbUser;
    
    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });

  } catch (error) {
    console.error('Login error:', error);
    
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