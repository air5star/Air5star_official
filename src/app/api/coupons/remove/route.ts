import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-utils';
import { removeCouponSchema } from '@/lib/validations';

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
    const validatedData = removeCouponSchema.parse(body);

    // For now, we'll just return success since coupon removal
    // is typically handled on the client side by clearing the applied coupon
    return NextResponse.json({
      success: true,
      message: 'Coupon removed successfully'
    });

  } catch (error) {
    console.error('Remove coupon error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}