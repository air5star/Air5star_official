import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-utils';
import { applyCouponSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const body = await request.json();
    
    // Validate request body
    const validationResult = applyCouponSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { code, orderAmount } = validationResult.data;
    const now = new Date();

    // Find the coupon
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        validFrom: {
          lte: now
        },
        validUntil: {
          gte: now
        }
      }
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid or expired coupon code' },
        { status: 400 }
      );
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return NextResponse.json(
        { error: `Minimum order amount of ₹${coupon.minOrderAmount} required` },
        { status: 400 }
      );
    }

    // Check if user has already used this coupon
    const existingUsage = await prisma.couponUsage.findUnique({
      where: {
        couponId_userId: {
          couponId: coupon.id,
          userId: user.id
        }
      }
    });

    if (existingUsage) {
      return NextResponse.json(
        { error: 'Coupon has already been used' },
        { status: 400 }
      );
    }

    // Check usage limit
    if (coupon.usageLimit) {
      const totalUsage = await prisma.couponUsage.count({
        where: {
          couponId: coupon.id
        }
      });

      if (totalUsage >= coupon.usageLimit) {
        return NextResponse.json(
          { error: 'Coupon usage limit exceeded' },
          { status: 400 }
        );
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (orderAmount * coupon.value) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discount = coupon.value;
    } else if (coupon.type === 'FREE_SHIPPING') {
      // For free shipping, we'll return the shipping amount as discount
      // This will be handled in the frontend
      discount = 50; // Default shipping cost
    }

    // Ensure discount doesn't exceed order amount
    discount = Math.min(discount, orderAmount);

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount
      },
      discount: Math.round(discount * 100) / 100 // Round to 2 decimal places
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}