import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';

const processPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentMethod: z.enum(['RAZORPAY', 'STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'EMI']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('INR'),
  paymentDetails: z.object({
    razorpay_payment_id: z.string().optional(),
    razorpay_order_id: z.string().optional(),
    razorpay_signature: z.string().optional(),
    stripe_payment_intent_id: z.string().optional(),
    paypal_payment_id: z.string().optional(),
  }).optional(),
  isEmi: z.boolean().default(false),
  emiPlanId: z.string().optional(),
});

// POST /api/checkout/process-payment - Handle payment processing
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
    const validatedData = processPaymentSchema.parse(body);
    const { orderId, paymentMethod, amount, currency, paymentDetails, isEmi, emiPlanId } = validatedData;

    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.userId,
        status: 'PENDING',
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or already processed' },
        { status: 404 }
      );
    }

    // Verify amount matches order total
    if (Math.abs(order.totalAmount - amount) > 0.01) {
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      );
    }

    let paymentStatus = 'PENDING';
    let transactionId = null;

    // Process payment based on method
    switch (paymentMethod) {
      case 'RAZORPAY':
        if (!paymentDetails?.razorpay_payment_id) {
          return NextResponse.json(
            { error: 'Razorpay payment details required' },
            { status: 400 }
          );
        }
        // In a real implementation, verify the payment with Razorpay
        paymentStatus = 'COMPLETED';
        transactionId = paymentDetails.razorpay_payment_id;
        break;

      case 'STRIPE':
        if (!paymentDetails?.stripe_payment_intent_id) {
          return NextResponse.json(
            { error: 'Stripe payment details required' },
            { status: 400 }
          );
        }
        // In a real implementation, verify the payment with Stripe
        paymentStatus = 'COMPLETED';
        transactionId = paymentDetails.stripe_payment_intent_id;
        break;

      case 'PAYPAL':
        if (!paymentDetails?.paypal_payment_id) {
          return NextResponse.json(
            { error: 'PayPal payment details required' },
            { status: 400 }
          );
        }
        // In a real implementation, verify the payment with PayPal
        paymentStatus = 'COMPLETED';
        transactionId = paymentDetails.paypal_payment_id;
        break;

      case 'EMI':
        if (!emiPlanId) {
          return NextResponse.json(
            { error: 'EMI plan required for EMI payment' },
            { status: 400 }
          );
        }
        // EMI payments are typically approved after verification
        paymentStatus = 'PENDING';
        transactionId = `EMI_${Date.now()}`;
        break;

      case 'BANK_TRANSFER':
        paymentStatus = 'PENDING';
        transactionId = `BT_${Date.now()}`;
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported payment method' },
          { status: 400 }
        );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId,
        userId: user.userId,
        amount,
        currency,
        paymentMethod,
        status: paymentStatus,
        transactionId,
        paymentDetails: paymentDetails || {},
        isEmi,
        emiPlanId,
      },
    });

    // Update order status based on payment
    let newOrderStatus = 'PENDING';
    if (paymentStatus === 'COMPLETED') {
      newOrderStatus = 'CONFIRMED';
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newOrderStatus,
        paymentStatus,
        paymentMethod,
      },
    });

    // If payment is completed, clear the user's cart
    if (paymentStatus === 'COMPLETED') {
      await prisma.cartItem.deleteMany({
        where: { userId: user.userId },
      });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: paymentStatus,
        transactionId,
        amount,
        currency,
        paymentMethod,
      },
      order: {
        id: orderId,
        status: newOrderStatus,
        paymentStatus,
      },
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}