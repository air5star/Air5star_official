import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addToCartSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';

// POST /api/cart/add - Add hardcoded product to user's cart
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
    const validatedData = addToCartSchema.parse(body);
    const { productId, quantity } = validatedData;

    // Handle both database IDs (strings) and frontend IDs (numbers)
    let product;
    const productIdStr = String(productId);
    
    // First try direct ID lookup
    product = await prisma.product.findFirst({
      where: {
        id: productIdStr,
        isActive: true,
      },
      include: {
        inventory: true,
      },
    });

    // If not found and productId is numeric, try multiple SKU pattern lookups
    if (!product && !isNaN(Number(productId))) {
      const numericId = Number(productId);
      
      // Try different SKU patterns that might match
      const skuPatterns = [
        `_${numericId}`,           // SKU_air-conditioning_1
        `-${numericId.toString().padStart(3, '0')}`, // HVAC-001
        `-${numericId}`,           // HVAC-1
        `${numericId}`             // Direct number match
      ];
      
      for (const pattern of skuPatterns) {
        product = await prisma.product.findFirst({
          where: {
            sku: { contains: pattern },
            isActive: true,
          },
          include: {
            inventory: true,
          },
        });
        
        if (product) break; // Found a match, stop searching
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      );
    }

    // Check stock availability
    const availableStock = 
      (product.inventory?.stockQuantity || 0) - 
      (product.inventory?.reservedQuantity || 0);

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
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
          userId_productId: {
            userId: user.userId,
            productId: product.id, // Use the actual product ID from database
          },
        },
    });

    let cartItem;

    if (existingCartItem) {
      // Update existing cart item
      const newQuantity = existingCartItem.quantity + quantity;
      
      if (availableStock < newQuantity) {
        return NextResponse.json(
          { 
            error: 'Insufficient stock for total quantity', 
            availableStock,
            currentQuantity: existingCartItem.quantity,
            requestedQuantity: quantity,
            totalQuantity: newQuantity
          },
          { status: 400 }
        );
      }

      cartItem = await prisma.cartItem.update({
        where: {
          userId_productId: {
            userId: user.userId,
            productId: product.id, // Use the actual product ID from database
          },
        },
        data: {
          quantity: newQuantity,
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
            },
          },
        },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId: user.userId,
          productId: product.id, // Use the actual product ID from database
          quantity,
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
            },
          },
        },
      });
    }

    return NextResponse.json(
      {
        message: 'Product added to cart successfully',
        cartItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add product to cart' },
      { status: 500 }
    );
  }
}