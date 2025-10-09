import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

const updateCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

// PUT /api/cart/update - Update quantities
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCartSchema.parse(body);
    const { productId, quantity } = validatedData;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true, category: true },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: 'Product is no longer available' },
        { status: 400 }
      );
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: user.userId, productId } },
    });
    if (!existingItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    const stockQty = product.inventory?.stockQuantity ?? 0;
    const reservedQty = product.inventory?.reservedQuantity ?? 0;
    const availableStock = Math.max(stockQty - reservedQty, 0);

    if (availableStock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock', availableStock, requestedQuantity: quantity },
        { status: 400 }
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
    });

    const cartItemWithProduct = {
      id: updated.id,
      userId: updated.userId,
      productId: updated.productId,
      quantity: updated.quantity,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp ?? product.price,
        imageUrl: product.imageUrl ?? undefined,
        category: {
          name: product.category?.name ?? '',
          slug: product.category?.slug ?? '',
        },
      },
    };

    return NextResponse.json({ message: 'Cart item updated successfully', cartItem: cartItemWithProduct });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}