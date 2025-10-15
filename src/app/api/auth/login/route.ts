import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken, isValidPhone } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const emailOrMobileInput = (body.email ?? body.emailOrMobile ?? '').toString().trim();
    const password = (body.password ?? '').toString();

    if (!emailOrMobileInput || !password) {
      return NextResponse.json(
        { error: 'Email or mobile and password are required' },
        { status: 400 }
      );
    }

    let user: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      image: string | null;
      role: string;
      isActive: boolean;
      isEmailVerified: boolean;
      password: string | null;
    } | null = null;

    if (emailOrMobileInput.includes('@')) {
      const normalizedEmail = emailOrMobileInput.toLowerCase();
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          password: true,
        },
      });
    } else {
      const normalizedPhone = emailOrMobileInput.replace(/\D/g, '');
      if (!isValidPhone(normalizedPhone)) {
        return NextResponse.json(
          { error: 'Invalid email or mobile number' },
          { status: 400 }
        );
      }
      user = await prisma.user.findFirst({
        where: { phone: normalizedPhone },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          password: true,
        },
      });
    }

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.isActive === false) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email to continue', requiresVerification: true },
        { status: 403 }
      );
    }

    const token = await generateToken(user.id, user.role, user.email || undefined);

    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isEmailVerified,
        avatar: user.image,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('User login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}