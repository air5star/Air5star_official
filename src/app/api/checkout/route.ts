import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';

const validateCartSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive()
  }))
});

const calculateTotalsSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive()
  })),
  shippingAddressId: z.string().optional(),
  couponCode: z.string().optional()
});

// POST /api/checkout/validate - Validate cart against products
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { pathname } = new URL(request.url);
    
    if (pathname.endsWith('/validate')) {
      return validateCart(request, user.userId);
    } else if (pathname.endsWith('/calculate')) {
      return calculateTotals(request, user.userId);
    }

    return NextResponse.json(
      { error: 'Invalid endpoint' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function validateCart(request: NextRequest, userId: string) {
  const body = await request.json();
  const validatedData = validateCartSchema.parse(body);
  const { items } = validatedData;

  const validationResults = [];
  let isValid = true;

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: {
        id: item.productId,
        isActive: true,
      },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      validationResults.push({
        productId: item.productId,
        isValid: false,
        error: 'Product not found or not available',
      });
      isValid = false;
      continue;
    }

    const availableStock = 
      (product.inventory?.stockQuantity || 0) - 
      (product.inventory?.reservedQuantity || 0);

    if (availableStock < item.quantity) {
      validationResults.push({
        productId: item.productId,
        isValid: false,
        error: 'Insufficient stock',
        availableStock,
        requestedQuantity: item.quantity,
      });
      isValid = false;
    } else {
      validationResults.push({
        productId: item.productId,
        isValid: true,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          mrp: product.mrp,
        },
        availableStock,
      });
    }
  }

  return NextResponse.json({
    isValid,
    items: validationResults,
  });
}

async function calculateTotals(request: NextRequest, userId: string) {
  const body = await request.json();
  const validatedData = calculateTotalsSchema.parse(body);
  const { items, shippingAddressId, couponCode } = validatedData;

  let subtotal = 0;
  let totalMrp = 0;
  let totalSavings = 0;
  const itemDetails = [];

  // Calculate item totals
  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: {
        id: item.productId,
        isActive: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: `Product ${item.productId} not found` },
        { status: 404 }
      );
    }

    const itemSubtotal = product.price * item.quantity;
    const itemMrp = (product.mrp || product.price) * item.quantity;
    
    subtotal += itemSubtotal;
    totalMrp += itemMrp;
    totalSavings += itemMrp - itemSubtotal;

    itemDetails.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      quantity: item.quantity,
      subtotal: itemSubtotal,
    });
  }

  // Calculate shipping
  let shippingCost = 0;
  if (subtotal < 500) { // Free shipping above ₹500
    shippingCost = 50;
  }

  // Calculate tax (18% GST)
  const taxRate = 0.18;
  const taxAmount = subtotal * taxRate;

  // Apply coupon discount if provided
  let discountAmount = 0;
  if (couponCode) {
    // Simple discount logic - can be enhanced
    if (couponCode === 'SAVE10') {
      discountAmount = subtotal * 0.1; // 10% discount
    } else if (couponCode === 'FLAT50') {
      discountAmount = Math.min(50, subtotal * 0.05); // ₹50 or 5%, whichever is lower
    }
  }

  const total = subtotal + shippingCost + taxAmount - discountAmount;

  return NextResponse.json({
    items: itemDetails,
    pricing: {
      subtotal,
      totalMrp,
      totalSavings,
      shippingCost,
      taxAmount,
      discountAmount,
      total,
    },
    breakdown: {
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      freeShippingEligible: subtotal >= 500,
      couponApplied: couponCode && discountAmount > 0,
    },
  });
}