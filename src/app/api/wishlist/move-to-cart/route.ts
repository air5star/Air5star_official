import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth-utils';
import { productsData } from '@/data';
import { inMemoryCart, inMemoryWishlist } from '@/lib/storage';

const moveToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive').default(1),
});

// POST /api/wishlist/move-to-cart - Move wishlist item to cart
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
    const validatedData = moveToCartSchema.parse(body);
    const { productId, quantity } = validatedData;

    // Initialize user storage if it doesn't exist
    if (!inMemoryWishlist[user.userId]) {
      inMemoryWishlist[user.userId] = [];
    }
    if (!inMemoryCart[user.userId]) {
      inMemoryCart[user.userId] = [];
    }

    // Check if wishlist item exists
    const existingWishlistItemIndex = inMemoryWishlist[user.userId].findIndex(
      item => item.productId === productId
    );

    if (existingWishlistItemIndex === -1) {
      return NextResponse.json(
        { error: 'Product not found in wishlist' },
        { status: 404 }
      );
    }

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
        { error: 'Product is no longer available' },
        { status: 400 }
      );
    }

    // For static data, assume sufficient stock
    const availableStock = 100;

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

    // Check if item already exists in cart
    const existingCartItemIndex = inMemoryCart[user.userId].findIndex(
      item => item.productId === productId
    );

    const now = new Date();
    let cartItem;

    if (existingCartItemIndex !== -1) {
      // Update existing cart item
      const existingCartItem = inMemoryCart[user.userId][existingCartItemIndex];
      const newQuantity = existingCartItem.quantity + quantity;
      
      if (availableStock < newQuantity) {
        return NextResponse.json(
          { 
            error: `Insufficient stock for total quantity. Available: ${availableStock}, Total requested: ${newQuantity}` 
          },
          { status: 400 }
        );
      }

      inMemoryCart[user.userId][existingCartItemIndex] = {
        ...existingCartItem,
        quantity: newQuantity,
        updatedAt: now,
      };
      
      cartItem = {
        id: `${user.userId}_${productId}`,
        userId: user.userId,
        productId,
        quantity: newQuantity,
        createdAt: existingCartItem.createdAt,
        updatedAt: now,
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
    } else {
      // Create new cart item with full product details for reliable mapping later
      const newCartItem = {
        productId,
        quantity,
        name: product.productTitle || product.name,
        price: product.price,
        mrp: product.mrp,
        imageUrl: product.imageUrl,
        sku: `SKU_${product.id}`,
        createdAt: now,
        updatedAt: now,
      };
      
      inMemoryCart[user.userId].push(newCartItem);
      
      cartItem = {
        id: `${user.userId}_${productId}`,
        userId: user.userId,
        productId,
        quantity,
        createdAt: now,
        updatedAt: now,
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
    }

    // Remove from wishlist
    inMemoryWishlist[user.userId].splice(existingWishlistItemIndex, 1);

    const result = cartItem;

    return NextResponse.json({
      message: 'Product moved to cart successfully',
      cartItem: result,
      movedFrom: 'wishlist',
    });
  } catch (error) {
    console.error('Error moving to cart:', error);
    
    if (error instanceof Error && error.message.includes('Insufficient stock')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to move product to cart' },
      { status: 500 }
    );
  }
}