import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-utils';

// POST /api/orders/[id]/cancel - Cancel order within 12 hours with 5% deduction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { reason } = await request.json().catch(() => ({ reason: undefined }));

    const order = await prisma.order.findFirst({
      where: { id, userId: user.userId },
      include: {
        orderTracking: {
          orderBy: { createdAt: 'asc' },
        },
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Order cannot be cancelled at this stage' },
        { status: 400 }
      );
    }

    // Determine confirmation time from tracking; fallback to updatedAt
    const confirmedTrack = order.orderTracking.find(t => t.status === 'CONFIRMED');
    const confirmedAt = confirmedTrack ? new Date(confirmedTrack.createdAt) : new Date(order.updatedAt);
    const hoursSinceConfirmation = (Date.now() - confirmedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceConfirmation > 12) {
      return NextResponse.json(
        { error: 'Cancellation window expired. Orders can be cancelled within 12 hours of confirmation.' },
        { status: 400 }
      );
    }

    // 5% deduction on cancellation
    const deductionRate = 0.05;
    const refundAmount = Math.round((order.totalAmount * (1 - deductionRate)) * 100) / 100;

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        notes: `Order cancelled by customer. Reason: ${reason || 'N/A'}. Refund after 5% deduction: ₹${refundAmount}.`,
      },
    });

    await prisma.orderTracking.create({
      data: {
        orderId: order.id,
        status: 'CANCELLED',
        message: `Order cancelled within 12 hours. 5% fee deducted. Refund: ₹${refundAmount}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully. Refund will be processed as per policy.',
      order: updatedOrder,
      refundAmount,
      deductionRate,
    });
  } catch (error) {
    console.error('Order cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}