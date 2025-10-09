import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';
import { productsData } from '@/data';

// In-memory wishlist storage (shared with main wishlist route)
const inMemoryWishlist: { [userId: string]: Array<{ productId: string; createdAt: Date; updatedAt: Date }> } = {};

const removeFromWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

// DELETE /api/wishlist/remove - Remove from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = removeFromWishlistSchema.parse(body);
    const { productId } = validatedData;

    // Initialize user wishlist if it doesn't exist
    if (!inMemoryWishlist[user.userId]) {
      inMemoryWishlist[user.userId] = [];
    }

    // Check if wishlist item exists
    const existingItemIndex = inMemoryWishlist[user.userId].findIndex(
      item => item.productId === productId
    );

    if (existingItemIndex === -1) {
      return NextResponse.json(
        { error: 'Product not found in wishlist' },
        { status: 404 }
      );
    }

    // Find product in static data for response
    let product = null;
    for (const category of productsData) {
      if (category.products) {
        product = category.products.find(p => p.id.toString() === productId);
        if (product) break;
      }
    }

    // Remove from wishlist
    inMemoryWishlist[user.userId].splice(existingItemIndex, 1);

    return NextResponse.json({
      message: 'Product removed from wishlist successfully',
      removedItem: {
        productId: productId,
        productName: product ? (product.productTitle || product.name) : 'Unknown Product',
      },
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove product from wishlist' },
      { status: 500 }
    );
  }
}

// POST /api/wishlist/remove - Alternative endpoint for removing items (supports both POST and DELETE)
export async function POST(request: NextRequest) {
  return DELETE(request);
}