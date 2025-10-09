import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { frontendAddressSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';

// GET /api/user/addresses/[id] - Get a specific address
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address' },
      { status: 500 }
    );
  }
}

// PUT /api/user/addresses/[id] - Update an address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = frontendAddressSchema.parse(body);

    // Transform frontend data to database format
    const [firstName, ...lastNameParts] = validatedData.fullName.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If this is set as default, unset other default addresses
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.userId,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update address
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        type: validatedData.addressType,
        firstName,
        lastName,
        addressLine: validatedData.addressLine1,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.pincode,
        phone: validatedData.mobile,
        isDefault: validatedData.isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      address: updatedAddress,
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/addresses/[id] - Delete an address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Check if this address is used in any pending orders
    const ordersUsingAddress = await prisma.order.findFirst({
      where: {
        shippingAddressId: id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
        },
      },
    });

    if (ordersUsingAddress) {
      return NextResponse.json(
        { error: 'Cannot delete address that is used in active orders' },
        { status: 400 }
      );
    }

    // Delete address
    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}