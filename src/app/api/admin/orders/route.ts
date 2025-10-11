import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';
const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
  'REFUNDED',
] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
    'REFUNDED'
  ]),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/admin/orders - Get all orders for admin management
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as OrderStatus;
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const paymentStatus = searchParams.get('paymentStatus');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status && ORDER_STATUSES.includes(status as OrderStatus)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { shippingAddress: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (paymentStatus) {
      where.payment = {
        status: paymentStatus,
      };
    }

    // Get orders with related data
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  image: true,
                },
              },
            },
          },
          shippingAddress: true,
          payments: {
            select: {
              id: true,
              method: true,
              status: true,
              amount: true,
              transactionId: true,
            },
          },
          emiPlan: {
            select: {
              id: true,
              name: true,
              tenure: true,
              interestRate: true,
            },
          },
          orderTracking: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Get order statistics
    const stats = await Promise.all([
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          status: {
            in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
          },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    // Format orders with calculated data
    const formattedOrders = orders.map((order: {
      id: string;
      orderNumber: string;
      status: OrderStatus | string;
      totalAmount: number;
      createdAt: Date;
      updatedAt: Date;
      user: { id: string; name: string | null; email: string | null; phone: string | null } | null;
      shippingAddress: any;
      payments: Array<{ id: string; method: string; status: string; amount: number; transactionId: string | null }>;
      emiPlan: { id: string; name: string; tenure: number; interestRate: number } | null;
      orderItems: Array<{ id: string; quantity: number; price: number; product: { id: string; name: string; sku: string; image: string | null } }>;
      orderTracking: Array<{ status: string; location: string | null; notes: string | null; createdAt: Date }>;
    }) => {
      const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const latestTracking = order.orderTracking[0];
      
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        user: order.user,
        shippingAddress: order.shippingAddress,
        payments: order.payments,
        emiPlan: order.emiPlan,
        latestTracking: latestTracking ? {
          status: latestTracking.status,
          location: latestTracking.location,
          notes: latestTracking.notes,
          createdAt: latestTracking.createdAt,
        } : null,
        items: order.orderItems.map((item: { id: string; quantity: number; price: number; product: { id: string; name: string; sku: string; image: string | null } }) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          product: item.product,
        })),
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      statistics: {
        pending: stats[0],
        confirmed: stats[1],
        processing: stats[2],
        shipped: stats[3],
        delivered: stats[4],
        cancelled: stats[5],
        totalRevenue: stats[6]._sum.totalAmount || 0,
        todayOrders: stats[7],
      },
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/orders - Update order status
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = updateOrderStatusSchema.parse(body);
    const { orderId, status, trackingNumber, notes } = validatedData;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                inventory: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
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

    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED'],
      DELIVERED: ['RETURNED'],
      CANCELLED: [],
      RETURNED: ['REFUNDED'],
      REFUNDED: [],
    };

    const currentStatus = order.status as OrderStatus;
    const nextStatus = status as OrderStatus;
    if (!validTransitions[currentStatus].includes(nextStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatus} to ${nextStatus}`,
          validTransitions: validTransitions[currentStatus],
        },
        { status: 400 }
      );
    }

    // Handle inventory adjustments based on status change
    const inventoryUpdates: any[] = [];
    
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      // Release reserved inventory
      for (const item of order.orderItems) {
        if (item.product.inventory) {
          inventoryUpdates.push(
            prisma.inventory.update({
              where: { productId: item.productId },
              data: {
                reservedQuantity: {
                  decrement: item.quantity,
                },
              },
            })
          );
        }
      }
    } else if (status === 'CONFIRMED' && order.status === 'PENDING') {
      // Convert available to reserved inventory
      for (const item of order.orderItems) {
        if (item.product.inventory) {
          const availableStock = item.product.inventory.quantity - item.product.inventory.reservedQuantity;
          if (availableStock < item.quantity) {
            return NextResponse.json(
              {
                error: `Insufficient stock for ${item.product.name}. Available: ${availableStock}, Required: ${item.quantity}`,
              },
              { status: 400 }
            );
          }
          
          inventoryUpdates.push(
            prisma.inventory.update({
              where: { productId: item.productId },
              data: {
                reservedQuantity: {
                  increment: item.quantity,
                },
              },
            })
          );
        }
      }
    } else if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
      // Convert reserved to sold (reduce both quantities)
      for (const item of order.orderItems) {
        if (item.product.inventory) {
          inventoryUpdates.push(
            prisma.inventory.update({
              where: { productId: item.productId },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
                reservedQuantity: {
                  decrement: item.quantity,
                },
              },
            })
          );
        }
      }
    }

    // Perform updates in transaction
    const result = await prisma.$transaction([
      // Update order status
      prisma.order.update({
        where: { id: orderId },
        data: { status },
      }),
      // Create tracking entry
      prisma.orderTracking.create({
        data: {
          orderId,
          status,
          location: trackingNumber ? 'In Transit' : undefined,
          notes: notes || `Order status updated to ${status}`,
          trackingNumber,
        },
      }),
      // Apply inventory updates
      ...inventoryUpdates,
    ]);

    const updatedOrder = result[0];
    const trackingEntry = result[1];

    return NextResponse.json({
      message: `Order status updated to ${status} successfully`,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt,
      },
      tracking: trackingEntry,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/orders - Cancel an order
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const reason = searchParams.get('reason') || 'Cancelled by admin';

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Check if order exists and can be cancelled
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                inventory: true,
              },
            },
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

    // Check if order can be cancelled
    const cancellableStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING'];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          error: `Cannot cancel order with status ${order.status}`,
          cancellableStatuses,
        },
        { status: 400 }
      );
    }

    // Release reserved inventory and update order status
    const inventoryUpdates = order.orderItems.map((item: { productId: string; quantity: number; product: { inventory: any } }) => {
      if (item.product.inventory) {
        return prisma.inventory.update({
          where: { productId: item.productId },
          data: {
            reservedQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }
      return null;
    }).filter(Boolean);

    await prisma.$transaction([
      // Update order status
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      }),
      // Create tracking entry
      prisma.orderTracking.create({
        data: {
          orderId,
          status: 'CANCELLED',
          notes: reason,
        },
      }),
      // Release inventory
      ...inventoryUpdates,
    ]);

    return NextResponse.json({
      message: 'Order cancelled successfully',
      orderId,
      reason,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}