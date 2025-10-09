import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPaymentSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';
import Razorpay from 'razorpay';

// POST /api/payments/create - Create payment for an order
export async function POST(request: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      console.error('Razorpay keys not configured: ', {
        hasKeyId: Boolean(keyId),
        hasKeySecret: Boolean(keySecret),
      });
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);
    const { orderId, paymentMethod } = validatedData;

    // Verify order belongs to user and is in correct status
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.userId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or not eligible for payment' },
        { status: 404 }
      );
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
    });
    if (existingPayment && existingPayment.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment already completed for this order' },
        { status: 400 }
      );
    }

    let paymentAmount = order.totalAmount;
    const isEmi = paymentMethod === 'EMI';

    let razorpayOrder = null;
    let razorpayOrderId = null;

    // Always create Razorpay order (only online payments supported)
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: paymentAmount * 100, // Convert to paise
        currency: 'INR',
        receipt: `order_${order.orderNumber}`,
        notes: {
          orderId: order.id,
          userId: user.userId,
          orderNumber: order.orderNumber,
        },
      });
      razorpayOrderId = razorpayOrder.id;
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError);
      return NextResponse.json(
        { error: 'Failed to create payment order' },
        { status: 500 }
      );
    }

    // Create or update payment record
    let payment;
    if (existingPayment) {
      // Update existing payment
      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: paymentAmount,
          paymentMethod: 'RAZORPAY',
          status: 'PENDING',
          razorpayOrderId,
          isEmi,
        },
      });
    } else {
      // Create new payment
      payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: paymentAmount,
          paymentMethod: 'RAZORPAY',
          status: 'PENDING',
          razorpayOrderId,
          isEmi,
        },
      });
    }

    // No COD support: orders stay pending until payment is completed

    const response: any = {
      message: 'Payment initiated successfully',
      payment: {
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        isEmi: payment.isEmi,
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      },
    };

    // Add Razorpay details for online payments
    if (razorpayOrder) {
      response.razorpay = {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      };
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}