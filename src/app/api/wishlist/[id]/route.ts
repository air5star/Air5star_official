import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-utils';

// In-memory wishlist storage (shared with main wishlist route)
const inMemoryWishlist: { [userId: string]: Array<{ productId: string; createdAt: Date; updatedAt: Date }> } = {};

// DELETE /api/wishlist/[id] - Remove specific item from wishlist
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
    
    // Extract productId from the id (format: userId_productId)
    const productId = id.replace(`${user.userId}_`, '');

    // Check if user has wishlist items
    if (!inMemoryWishlist[user.userId]) {
      return NextResponse.json(
        { error: 'Wishlist item not found' },
        { status: 404 }
      );
    }

    // Find and remove the item
    const itemIndex = inMemoryWishlist[user.userId].findIndex(
      item => item.productId === productId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Wishlist item not found' },
        { status: 404 }
      );
    }

    // Remove from wishlist
    inMemoryWishlist[user.userId].splice(itemIndex, 1);

    return NextResponse.json({
      message: 'Product removed from wishlist successfully',
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove product from wishlist' },
      { status: 500 }
    );
  }
}

// Alternative function to remove by product ID
export function removeByProductId(
  productId: string,
  userId: string
) {
  try {
    // Check if user has wishlist items
    if (!inMemoryWishlist[userId]) {
      return { error: 'Product not found in wishlist', status: 404 };
    }

    // Find and remove the item
    const itemIndex = inMemoryWishlist[userId].findIndex(
      item => item.productId === productId
    );

    if (itemIndex === -1) {
      return { error: 'Product not found in wishlist', status: 404 };
    }

    // Remove from wishlist
    inMemoryWishlist[userId].splice(itemIndex, 1);

    return { message: 'Product removed from wishlist successfully' };
  } catch (error) {
    console.error('Error removing from wishlist by product ID:', error);
    return { error: 'Failed to remove product from wishlist', status: 500 };
  }
}