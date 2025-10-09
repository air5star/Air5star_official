import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateOrderStatusSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';

// GET /api/orders/[id] - Get a specific order
export async function GET(
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

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: user.userId,
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                sku: true,
                brand: true,
                category: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        shippingAddress: true,
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            transactionId: true,
            razorpayOrderId: true,
            razorpayPaymentId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        orderTracking: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update order status (Admin only)
export async function PUT(
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

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateOrderStatusSchema.parse(body);
    const { status, trackingMessage, trackingLocation } = validatedData;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Start transaction for status update
    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
      });

      // Create tracking entry
      await tx.orderTracking.create({
        data: {
          orderId: id,
          status,
          message: trackingMessage || getDefaultTrackingMessage(status),
          location: trackingLocation || 'Processing Center',
        },
      });

      // Handle inventory based on status change
      if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
        // Release reserved inventory
        for (const item of existingOrder.items) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: {
              reservedQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      } else if (status === 'CONFIRMED' && existingOrder.status === 'PENDING') {
        // Convert reserved to sold
        for (const item of existingOrder.items) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
              reservedQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      return updatedOrder;
    });

    // Fetch updated order with all relations
    const completeOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                sku: true,
              },
            },
          },
        },
        shippingAddress: true,
        payments: true,
        orderTracking: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Order status updated successfully',
      order: completeOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

// Helper function to get default tracking messages
function getDefaultTrackingMessage(status: string): string {
  const messages: Record<string, string> = {
    PENDING: 'Order placed successfully',
    CONFIRMED: 'Order confirmed and being prepared',
    PROCESSING: 'Order is being processed',
    SHIPPED: 'Order has been shipped',
    OUT_FOR_DELIVERY: 'Order is out for delivery',
    DELIVERED: 'Order delivered successfully',
    CANCELLED: 'Order has been cancelled',
    RETURNED: 'Order has been returned',
  };

  return messages[status] || 'Order status updated';
}