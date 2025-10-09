import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';

const addToWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

// POST /api/wishlist/add - Add hardcoded product to wishlist
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
    const validatedData = addToWishlistSchema.parse(body);
    const { productId } = validatedData;

    // Check if product exists and is active
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      );
    }

    // Check if item already exists in wishlist
    const existingWishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.userId,
          productId,
        },
      },
    });

    if (existingWishlistItem) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      );
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: user.userId,
        productId,
      },
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

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: {
        productId,
        isApproved: true,
      },
      _avg: {
        rating: true,
      },
    });

    const reviewCount = await prisma.review.count({
      where: {
        productId,
        isApproved: true,
      },
    });

    const availableStock = 
      (wishlistItem.product.inventory?.stockQuantity || 0) - 
      (wishlistItem.product.inventory?.reservedQuantity || 0);

    const enrichedWishlistItem = {
      ...wishlistItem,
      product: {
        ...wishlistItem.product,
        averageRating: avgRating._avg.rating || 0,
        reviewCount,
        inStock: availableStock > 0,
        availableStock,
      },
    };

    return NextResponse.json(
      {
        message: 'Product added to wishlist successfully',
        wishlistItem: enrichedWishlistItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to add product to wishlist' },
      { status: 500 }
    );
  }
}