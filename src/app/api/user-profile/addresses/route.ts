import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-utils';
import { addressSchema } from '@/lib/validations';

// GET /api/user-profile/addresses - Get saved addresses
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

    // Count orders for each address
    const addressesWithStats = await Promise.all(
      addresses.map(async (address) => {
        const orderCount = await prisma.order.count({
          where: { shippingAddressId: address.id },
        });

        return {
          ...address,
          orderCount,
        };
      })
    );

    return NextResponse.json({
      addresses: addressesWithStats,
      totalAddresses: addresses.length,
      defaultAddress: addresses.find(addr => addr.isDefault) || null,
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// POST /api/user-profile/addresses - Add new address
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
    const validatedData = addressSchema.parse(body);

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
    const newAddress = await prisma.address.create({
      data: {
        ...validatedData,
        userId: user.userId,
      },
    });

    return NextResponse.json(
      {
        message: 'Address added successfully',
        address: newAddress,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding address:', error);
    return NextResponse.json(
      { error: 'Failed to add address' },
      { status: 500 }
    );
  }
}