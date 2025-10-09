import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth-utils';
import { productsData } from '@/data';
import { inMemoryCart } from '@/lib/storage';

const syncCartSchema = z.object({
  guestCartItems: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
  })),
});

// POST /api/cart/sync - Sync guest cart with logged-in user
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
    const validatedData = syncCartSchema.parse(body);
    const { guestCartItems } = validatedData;

    if (guestCartItems.length === 0) {
      return NextResponse.json({
        message: 'No guest cart items to sync',
        syncedItems: [],
      });
    }

    // Initialize user cart if it doesn't exist
    if (!inMemoryCart[user.userId]) {
      inMemoryCart[user.userId] = [];
    }

    const syncResults = [];
    const errors = [];
    const now = new Date();

    // Process each guest cart item
    for (const guestItem of guestCartItems) {
      try {
        // Find product in static data
        let product = null;
        for (const category of productsData) {
          if (category.products) {
            product = category.products.find(p => p.id.toString() === guestItem.productId);
            if (product) break;
          }
        }

        if (!product) {
          errors.push({
            productId: guestItem.productId,
            error: 'Product not found or not available',
          });
          continue;
        }

        // For static data, assume sufficient stock
        const availableStock = 100;

        if (availableStock < guestItem.quantity) {
          errors.push({
            productId: guestItem.productId,
            error: 'Insufficient stock',
            availableStock,
            requestedQuantity: guestItem.quantity,
          });
          continue;
        }

        // Check if item already exists in user's cart
        const existingItemIndex = inMemoryCart[user.userId].findIndex(
          item => item.productId === guestItem.productId
        );

        if (existingItemIndex !== -1) {
          // Merge quantities
          const existingItem = inMemoryCart[user.userId][existingItemIndex];
          const newQuantity = existingItem.quantity + guestItem.quantity;
          
          if (availableStock < newQuantity) {
            // Use maximum available stock
            const finalQuantity = Math.min(availableStock, newQuantity);
            
            inMemoryCart[user.userId][existingItemIndex] = {
              ...existingItem,
              quantity: finalQuantity,
              name: product.productTitle || product.name,
              price: product.price,
              mrp: product.mrp || product.price,
              imageUrl: product.imageUrl || product.image,
              sku: product.sku || `SKU_${product.id}`,
              updatedAt: now,
            };

            syncResults.push({
              productId: guestItem.productId,
              action: 'merged_with_limit',
              originalQuantity: existingItem.quantity,
              guestQuantity: guestItem.quantity,
              finalQuantity,
              availableStock,
            });
          } else {
            inMemoryCart[user.userId][existingItemIndex] = {
              ...existingItem,
              quantity: newQuantity,
              name: product.productTitle || product.name,
              price: product.price,
              mrp: product.mrp || product.price,
              imageUrl: product.imageUrl || product.image,
              sku: product.sku || `SKU_${product.id}`,
              updatedAt: now,
            };

            syncResults.push({
              productId: guestItem.productId,
              action: 'merged',
              originalQuantity: existingItem.quantity,
              guestQuantity: guestItem.quantity,
              finalQuantity: newQuantity,
            });
          }
        } else {
          // Create new cart item with full product details
          const newItem = {
            productId: guestItem.productId,
            quantity: guestItem.quantity,
            name: product.productTitle || product.name,
            price: product.price,
            mrp: product.mrp || product.price,
            imageUrl: product.imageUrl || product.image,
            sku: product.sku || `SKU_${product.id}`,
            createdAt: now,
            updatedAt: now,
          };
          
          inMemoryCart[user.userId].push(newItem);

          syncResults.push({
            productId: guestItem.productId,
            action: 'added',
            quantity: guestItem.quantity,
          });
        }
      } catch (itemError) {
        console.error(`Error syncing item ${guestItem.productId}:`, itemError);
        errors.push({
          productId: guestItem.productId,
          error: 'Failed to sync item',
        });
      }
    }

    // Get updated cart summary from in-memory storage
    const cartItems = inMemoryCart[user.userId] || [];

    // Map cart items with static product data for summary calculation
    const cartItemsWithProducts = cartItems.map((item) => {
      // Find product in static data
      let product = null;
      for (const category of productsData) {
        if (category.products) {
          product = category.products.find(p => p.id.toString() === item.productId);
          if (product) break;
        }
      }
      return product ? { ...item, product } : null;
    }).filter(Boolean);

    const cartSummary = cartItemsWithProducts.reduce(
      (acc, item) => {
        const itemTotal = item.product.price * item.quantity;
        const itemMrpTotal = (item.product.mrp || item.product.price) * item.quantity;
        
        acc.totalItems += item.quantity;
        acc.totalAmount += itemTotal;
        acc.totalMrp += itemMrpTotal;
        acc.totalSavings += itemMrpTotal - itemTotal;
        
        return acc;
      },
      {
        totalItems: 0,
        totalAmount: 0,
        totalMrp: 0,
        totalSavings: 0,
      }
    );

    return NextResponse.json({
      message: 'Guest cart synced successfully',
      syncResults,
      errors,
      cartSummary,
      stats: {
        totalGuestItems: guestCartItems.length,
        successfulSyncs: syncResults.length,
        failedSyncs: errors.length,
      },
    });
  } catch (error) {
    console.error('Error syncing guest cart:', error);
    return NextResponse.json(
      { error: 'Failed to sync guest cart' },
      { status: 500 }
    );
  }
}