import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { frontendAddressSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';

// GET /api/user/addresses - Get user addresses
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// POST /api/user/addresses - Create a new address
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = frontendAddressSchema.parse(body);

    // If this is set as default, unset other default addresses
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create new address
    const address = await prisma.address.create({
      data: {
        userId: user.userId,
        type: validatedData.addressType,
        fullName: validatedData.fullName,
        mobile: validatedData.mobile,
        addressLine1: validatedData.addressLine1,
        addressLine2: validatedData.addressLine2 || null,
        city: validatedData.city,
        state: validatedData.state,
        pincode: validatedData.pincode,
        landmark: validatedData.landmark || null,
        country: 'India',
        isDefault: validatedData.isDefault,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Address created successfully',
        address,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}