import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, generateOrderNumber } from '@/lib/auth-utils';
import { createOrderSchema } from '@/lib/validations';

// POST /api/checkout/create-order - Finalize order creation
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
    const { shippingAddressId, paymentMethod, notes, isEmi, emiPlanId } = validatedData;

    // Get user's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.userId },
      include: {
        product: {
          include: {
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

    // Validate shipping address
    const shippingAddress = await prisma.address.findFirst({
      where: {
        id: shippingAddressId,
        userId: user.userId,
      },
    });

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Invalid shipping address' },
        { status: 400 }
      );
    }

    // Validate EMI plan if EMI payment
    let emiPlan = null;
    if (isEmi && emiPlanId) {
      emiPlan = await prisma.emiPlan.findFirst({
        where: {
          id: emiPlanId,
          isActive: true,
        },
      });

      if (!emiPlan) {
        return NextResponse.json(
          { error: 'Invalid EMI plan' },
          { status: 400 }
        );
      }
    }

    // Validate stock and calculate totals
    let subtotal = 0;
    let totalMrp = 0;
    const orderItems = [];
    const stockIssues = [];

    for (const cartItem of cartItems) {
      const product = cartItem.product;
      const availableStock = 
        (product.inventory?.stockQuantity || 0) - 
        (product.inventory?.reservedQuantity || 0);

      if (!product.isActive) {
        stockIssues.push({
          productId: product.id,
          productName: product.name,
          issue: 'Product is no longer available',
        });
        continue;
      }

      if (availableStock < cartItem.quantity) {
        stockIssues.push({
          productId: product.id,
          productName: product.name,
          issue: `Insufficient stock. Available: ${availableStock}, Requested: ${cartItem.quantity}`,
          availableStock,
          requestedQuantity: cartItem.quantity,
        });
        continue;
      }

      const itemSubtotal = product.price * cartItem.quantity;
      const itemMrp = (product.mrp || product.price) * cartItem.quantity;
      
      subtotal += itemSubtotal;
      totalMrp += itemMrp;

      orderItems.push({
        productId: product.id,
        quantity: cartItem.quantity,
        price: product.price,
        mrp: product.mrp || product.price,
        subtotal: itemSubtotal,
      });
    }

    if (stockIssues.length > 0) {
      return NextResponse.json(
        { 
          error: 'Stock validation failed',
          stockIssues,
        },
        { status: 400 }
      );
    }

    // Calculate shipping, tax, and total
    const shippingCost = subtotal < 500 ? 50 : 0; // Free shipping above ₹500
    const taxRate = 0.18; // 18% GST
    const taxAmount = subtotal * taxRate;
    const totalSavings = totalMrp - subtotal;
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user.userId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod,
          subtotal,
          shippingCost,
          taxAmount,
          totalAmount,
          totalSavings,
          shippingAddressId,
          notes,
          isEmi,
          emiPlanId,
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: orderItems.map(item => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          mrp: item.mrp,
        })),
      });

      // Reserve inventory
      for (const item of orderItems) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            reservedQuantity: {
              increment: item.quantity,
            },
          },
        });
      }

      return order;
    });

    // Fetch the complete order with items and address
    const completeOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        items: {
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
        emiPlan: emiPlan ? {
          select: {
            id: true,
            name: true,
            months: true,
            interestRate: true,
          },
        } : false,
      },
    });

    return NextResponse.json(
      {
        message: 'Order created successfully',
        order: completeOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}