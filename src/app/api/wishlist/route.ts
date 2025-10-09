import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';
import { productsData } from '@/data';

// In-memory wishlist storage
const inMemoryWishlist: { [userId: string]: Array<{ productId: string; createdAt: Date; updatedAt: Date }> } = {};

const addToWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Get wishlist items from in-memory storage
    const userWishlist = inMemoryWishlist[user.userId] || [];
    const totalCount = userWishlist.length;
    
    // Sort by createdAt desc and apply pagination
    const sortedWishlist = userWishlist.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const wishlistItems = sortedWishlist.slice(skip, skip + limit).map(item => ({
      id: `${user.userId}_${item.productId}`,
      userId: user.userId,
      productId: item.productId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    // Map wishlist items with static product data
    const wishlistWithProducts = wishlistItems.map((item) => {
      // Find product in static data
      let product = null;
      for (const category of productsData) {
        if (category.products) {
          product = category.products.find(p => p.id.toString() === item.productId);
          if (product) break;
        }
      }

      if (!product) {
        return null; // Skip items where product is not found
      }

      return {
        ...item,
        product: {
          id: product.id.toString(),
          name: product.productTitle || product.name,
          price: product.price,
          mrp: product.mrp,
          imageUrl: product.imageUrl,
          category: {
            name: product.category,
            slug: product.category,
          },
          averageRating: 4.5, // Default rating for static data
          reviewCount: 10, // Default review count
          inStock: true,
          availableStock: 100,
        },
      };
    }).filter(Boolean); // Remove null items

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      items: wishlistWithProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Add item to wishlist
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

    // Find product in static data
    let product = null;
    for (const category of productsData) {
      if (category.products) {
        product = category.products.find(p => p.id.toString() === productId);
        if (product) break;
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      );
    }

    // Initialize user wishlist if it doesn't exist
    if (!inMemoryWishlist[user.userId]) {
      inMemoryWishlist[user.userId] = [];
    }

    // Check if item already exists in wishlist
    const existingWishlistItem = inMemoryWishlist[user.userId].find(
      item => item.productId === productId
    );

    if (existingWishlistItem) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      );
    }

    // Add to wishlist
    const now = new Date();
    const wishlistItem = {
      id: `${user.userId}_${productId}`,
      userId: user.userId,
      productId,
      createdAt: now,
      updatedAt: now,
    };
    
    inMemoryWishlist[user.userId].push({
      productId,
      createdAt: now,
      updatedAt: now,
    });

    // Add static product data to response
    const wishlistItemWithProduct = {
      ...wishlistItem,
      product: {
        id: product.id.toString(),
        name: product.productTitle || product.name,
        price: product.price,
        mrp: product.mrp,
        imageUrl: product.imageUrl,
        category: {
          name: product.category,
          slug: product.category,
        },
      },
    };

    return NextResponse.json(
      {
        message: 'Product added to wishlist successfully',
        wishlistItem: wishlistItemWithProduct,
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

// DELETE /api/wishlist - Remove all items from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Clear user's wishlist from in-memory storage
    if (inMemoryWishlist[user.userId]) {
      inMemoryWishlist[user.userId] = [];
    }

    return NextResponse.json({
      message: 'Wishlist cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to clear wishlist' },
      { status: 500 }
    );
  }
}