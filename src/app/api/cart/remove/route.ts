import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

const removeFromCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

// DELETE /api/cart/remove - Remove items
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = removeFromCartSchema.parse(body);
    const { productId } = validatedData;

    const existingItem = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: user.userId, productId } },
      include: { product: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id: existingItem.id } });

    return NextResponse.json({
      message: 'Item removed from cart successfully',
      removedItem: {
        productId,
        productName: existingItem.product ? existingItem.product.name : 'Unknown Product',
      },
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}

// POST /api/cart/remove - Alternative POST method for removing items
export async function POST(request: NextRequest) {
  return DELETE(request);
}