import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const now = new Date();

    // Get available coupons for the user
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: {
          lte: now
        },
        validUntil: {
          gte: now
        },
        OR: [
          { usageLimit: null },
          { usageLimit: { gt: 0 } }
        ]
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        type: true,
        value: true,
        minOrderAmount: true,
        maxDiscountAmount: true
      },
      orderBy: {
        value: 'desc'
      }
    });

    // Filter out coupons already used by this user (if single use)
    const availableCoupons = [];
    for (const coupon of coupons) {
      const usageCount = await prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId: userId
        }
      });

      // Check if user can still use this coupon
      if (usageCount === 0) {
        availableCoupons.push(coupon);
      }
    }

    return NextResponse.json({
      success: true,
      coupons: availableCoupons
    });
  } catch (error) {
    console.error('Error fetching available coupons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}