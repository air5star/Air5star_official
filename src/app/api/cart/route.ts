import { NextRequest, NextResponse } from 'next/server';
import { addToCartSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

// GET /api/cart - Get user's cart items
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.userId },
      include: {
        product: {
          include: {
            category: true,
            inventory: true,
          },
        },
      },
    });

    const items = cartItems
      .map((item) => {
        const product = item.product;
        if (!product || !product.isActive) return null;

        const stockQty = product.inventory?.stockQuantity ?? 0;
        const reservedQty = product.inventory?.reservedQuantity ?? 0;
        const availableStock = Math.max(stockQty - reservedQty, 0);

        return {
          id: item.id,
          userId: item.userId,
          productId: item.productId,
          quantity: item.quantity,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
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
          availableStock,
          inStock: availableStock >= item.quantity,
          maxQuantity: availableStock,
        };
      })
      .filter(Boolean) as any[];

    const summary = items.reduce(
      (acc, item) => {
        const itemTotal = item.product.price * item.quantity;
        const itemMrpTotal = (item.product.mrp || item.product.price) * item.quantity;
        acc.totalItems += item.quantity;
        acc.totalAmount += itemTotal;
        acc.totalMrp += itemMrpTotal;
        acc.totalSavings += itemMrpTotal - itemTotal;
        return acc;
      },
      { totalItems: 0, totalAmount: 0, totalMrp: 0, totalSavings: 0 }
    );

    return NextResponse.json({ items, summary });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = addToCartSchema.parse(body);
    const { productId, quantity, category } = validatedData;
    // Handle both database IDs (strings) and frontend IDs (numbers)
    let product;
    if (typeof productId === 'string' && !isNaN(Number(productId))) {
      // If productId is a numeric string, look up by SKU pattern with category context
      const numericId = Number(productId);
      
      // First try to find by exact database ID
      product = await prisma.product.findUnique({
        where: { id: productId },
        include: { inventory: true, category: true },
      });
      
      // If not found and we have category info, use it to construct the correct SKU
      if (!product && category) {
        const categorySlug = typeof category === 'string' ? category : category.slug;
        product = await prisma.product.findFirst({
          where: {
            sku: `SKU_${categorySlug}_${numericId}`
          },
          include: { inventory: true, category: true },
        });
      }
      
      // Fallback: search by SKU pattern but prioritize by category
      if (!product) {
        product = await prisma.product.findFirst({
          where: {
            sku: { contains: `_${numericId}` }
          },
          include: { inventory: true, category: true },
          orderBy: {
            createdAt: 'asc' // Get the first created product with this number
          }
        });
      }
    } else {
      // Standard lookup by ID
      product = await prisma.product.findUnique({
        where: { id: productId },
        include: { inventory: true, category: true },
      });
    }

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      );
    }

    const stockQty = product.inventory?.stockQuantity ?? 0;
    const reservedQty = product.inventory?.reservedQuantity ?? 0;
    const availableStock = Math.max(stockQty - reservedQty, 0);

    // Use the actual product ID from the database, not the frontend productId
    const actualProductId = product.id;
    
    const existingItem = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: user.userId, productId: actualProductId } },
    });

    const newQuantity = (existingItem?.quantity ?? 0) + quantity;
    if (availableStock < newQuantity) {
      return NextResponse.json(
        {
          error: 'Insufficient stock',
          availableStock,
          requestedQuantity: quantity,
          currentQuantity: existingItem?.quantity ?? 0,
          totalQuantity: newQuantity,
        },
        { status: 400 }
      );
    }

    let savedItem;
    if (existingItem) {
      savedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      savedItem = await prisma.cartItem.create({
        data: { userId: user.userId, productId: actualProductId, quantity },
      });
    }

    const cartItem = {
      id: savedItem.id,
      userId: savedItem.userId,
      productId: savedItem.productId,
      quantity: savedItem.quantity,
      createdAt: savedItem.createdAt,
      updatedAt: savedItem.updatedAt,
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

    return NextResponse.json(
      {
        message: 'Item added to cart successfully',
        cartItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.cartItem.deleteMany({ where: { userId: user.userId } });

    return NextResponse.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
  }
}
