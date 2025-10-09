import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';

const calculateTotalsSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive()
  })),
  shippingAddressId: z.string().optional(),
  couponCode: z.string().optional()
});

// POST /api/checkout/calculate - Calculate totals, tax, shipping
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
    let couponDetails = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { 
          code: couponCode,
          isActive: true
        }
      });

      if (coupon) {
        const now = new Date();
        const isValid = now >= coupon.validFrom && now <= coupon.validUntil;
        const meetsMinOrder = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;
        
        if (isValid && meetsMinOrder) {
          // Check if user has already used this coupon
          const existingUsage = await prisma.couponUsage.findUnique({
            where: {
              couponId_userId: {
                couponId: coupon.id,
                userId: user.id
              }
            }
          });

          if (!existingUsage) {
            // Calculate discount based on coupon type
            switch (coupon.type) {
              case 'PERCENTAGE':
                discountAmount = (subtotal * coupon.value) / 100;
                if (coupon.maxDiscountAmount) {
                  discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
                }
                break;
              case 'FIXED_AMOUNT':
                discountAmount = Math.min(coupon.value, subtotal);
                break;
              case 'FREE_SHIPPING':
                discountAmount = shippingCost;
                break;
            }
            
            couponDetails = {
              code: coupon.code,
              name: coupon.name,
              type: coupon.type.toLowerCase(),
              value: coupon.value,
              description: coupon.description || `${coupon.name} - ${coupon.type.toLowerCase()} discount`,
              discount: discountAmount
            };
          }
        }
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
        couponDetails,
      },
    });
  } catch (error) {
    console.error('Error calculating totals:', error);
    return NextResponse.json(
      { error: 'Failed to calculate totals' },
      { status: 500 }
    );
  }
}