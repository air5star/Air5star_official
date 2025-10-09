import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validations';
import { getUserFromRequest, generateOrderNumber } from '@/lib/auth-utils';
import { inMemoryCart, inMemoryOrders } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { shiprocketService } from '@/lib/shiprocket';
import { EmailService } from '@/lib/email';

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    // Get orders from database
    const whereClause: any = { userId: user.userId };
    if (status) {
      whereClause.status = status;
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
          payments: true,
          orderTracking: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
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
    const validatedData = createOrderSchema.parse(body);
    const { shippingAddressId, paymentMethod, emiPlanId } = validatedData;

    // Get user's cart items from database
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.userId },
      include: {
        product: {
          include: {
            category: true,
            inventory: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Transform cart items to include product details
    const cartItemsWithProducts = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      product: {
        name: item.product.name,
        price: item.product.price,
        mrp: item.product.mrp || item.product.price,
        imageUrl: item.product.imageUrl || '/placeholder-product.jpg',
        sku: item.product.sku
      }
    }));

    // Mock shipping address validation (simplified)
    const mockShippingAddress = {
      id: shippingAddressId,
      street: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    };

    // Generate order number
    const orderNumber = generateOrderNumber();
    const subtotal = cartItemsWithProducts.reduce(
      (sum, item) => sum + (item.product.price * item.quantity),
      0
    );
    const mrpTotal = cartItemsWithProducts.reduce(
      (sum, item) => sum + ((item.product.mrp || item.product.price) * item.quantity),
      0
    );
    const discount = mrpTotal - subtotal;
    const shippingCost = subtotal >= 500 ? 0 : 50; // Free shipping above ₹500
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const totalAmount = subtotal + shippingCost + tax;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.userId,
        status: 'PENDING',
        subtotal,
        discount,
        shippingCost,
        tax,
        totalAmount,
        shippingAddressId,
        orderItems: {
          create: cartItemsWithProducts.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
        orderTracking: {
          create: {
            status: 'PENDING',
            message: 'Order placed successfully',
          },
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        orderTracking: true,
      },
    });

    // Cart will be cleared after successful online payment verification

    // Integrate with Shiprocket for confirmed orders
    try {
      // Get user and shipping address details for Shiprocket
      const userDetails = await prisma.user.findUnique({
        where: { id: user.userId },
      });

      const shippingAddress = await prisma.address.findUnique({
        where: { id: shippingAddressId },
      });

      if (userDetails && shippingAddress) {
        // Format order data for Shiprocket
        const shiprocketOrderData = shiprocketService.formatOrderForShiprocket(
          order,
          userDetails,
          shippingAddress
        );

        // Create order in Shiprocket
        const shiprocketResponse = await shiprocketService.createOrder(shiprocketOrderData);

        // Update order with Shiprocket details
        await prisma.order.update({
          where: { id: order.id },
          data: {
            shiprocketOrderId: shiprocketResponse.order_id,
            awbCode: shiprocketResponse.awb_code,
            courierCompanyId: shiprocketResponse.courier_company_id,
            courierName: shiprocketResponse.courier_name,
            status: 'CONFIRMED', // Update status to confirmed after Shiprocket integration
          },
        });

        console.log(`Order ${order.orderNumber} successfully created in Shiprocket with ID: ${shiprocketResponse.order_id}`);
      }
    } catch (shiprocketError) {
      console.error('Shiprocket integration error:', shiprocketError);
      // Don't fail the order creation if Shiprocket fails
      // The order is still valid, just without shipping integration
    }

    // Send order confirmation email
    try {
      const userDetails = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          name: true,
          email: true,
          isEmailVerified: true,
        },
      });

      // Only send email to verified users
      if (userDetails && userDetails.isEmailVerified) {
        const emailService = new EmailService();
        
        // Calculate estimated delivery date (7-10 business days from now)
        const estimatedDeliveryDate = new Date();
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 9); // 9 days from now
        
        await emailService.sendOrderConfirmationEmail(
          userDetails.email,
          userDetails.name,
          {
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            items: order.orderItems.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.price,
            })),
            estimatedDeliveryDate,
          }
        );
        
        console.log(`Order confirmation email sent to ${userDetails.email} for order ${order.orderNumber}`);
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        items: order.orderItems,
        tracking: order.orderTracking,
        createdAt: order.createdAt,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}