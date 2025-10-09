import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateCartItemSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';

// PUT /api/cart/[id] - Update cart item quantity
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
    const validatedData = updateCartItemSchema.parse(body);
    const { quantity } = validatedData;

    // Check if cart item exists and belongs to user
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        userId: user.userId,
      },
      include: {
        product: {
          include: {
            inventory: true,
          },
        },
      },
    });

    if (!existingCartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Check if product is still active
    if (!existingCartItem.product.isActive) {
      return NextResponse.json(
        { error: 'Product is no longer available' },
        { status: 400 }
      );
    }

    // Check stock availability
    const availableStock = 
      (existingCartItem.product.inventory?.stockQuantity || 0) - 
      (existingCartItem.product.inventory?.reservedQuantity || 0);

    if (availableStock < quantity) {
      return NextResponse.json(
        { 
          error: 'Insufficient stock', 
          availableStock,
          requestedQuantity: quantity 
        },
        { status: 400 }
      );
    }

    // Update cart item
    const updatedCartItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        product: {
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
            inventory: {
              select: {
                stockQuantity: true,
                reservedQuantity: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Cart item updated successfully',
      cartItem: updatedCartItem,
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/[id] - Remove item from cart
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

    // Check if cart item exists and belongs to user
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!existingCartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Item removed from cart successfully',
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}