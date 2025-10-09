import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';

// Edge/Node compatible ETag generator using Web Crypto
async function computeETag(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `W/"${hex}"`;
}

// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          orderBy: {
            isDefault: 'desc',
          },
        },
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a lightweight ETag from id + updatedAt
    const etagSource = `${userProfile.id}-${new Date(userProfile.updatedAt).getTime()}`;
    const etag = await computeETag(etagSource);

    const incomingEtag = request.headers.get('if-none-match');
    if (incomingEtag && incomingEtag === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'private, max-age=30, must-revalidate',
          Vary: 'Authorization',
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        user: userProfile,
      },
      {
        status: 200,
        headers: {
          ETag: etag,
          'Cache-Control': 'private, max-age=30, must-revalidate',
          Vary: 'Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Fetch updated user with addresses
    const userWithAddresses = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          orderBy: {
            isDefault: 'desc',
          },
        },
      },
    });

    // New ETag after update
    const etagSource = `${userWithAddresses?.id}-${userWithAddresses ? new Date(userWithAddresses.updatedAt).getTime() : Date.now()}`;
    const etag = await computeETag(etagSource);

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        user: userWithAddresses,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
          ETag: etag,
          Vary: 'Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}