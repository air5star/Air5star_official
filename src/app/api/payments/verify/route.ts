import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymentSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';
import { inMemoryCart } from '@/lib/storage';
import { EmailService } from '@/lib/email';
import shiprocketService from '@/lib/shiprocket';
import crypto from 'crypto';

// POST /api/payments/verify - Verify Razorpay payment
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
    const validatedData = verifyPaymentSchema.parse(body);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = validatedData;

    // Find payment record by Razorpay order id
    const payment = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
      },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Verify payment belongs to user
    if (payment.order.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to payment' },
        { status: 403 }
      );
    }

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    console.log('[VerifyAPI] Calculated expectedSignature:', expectedSignature);
    console.log('[VerifyAPI] Provided razorpay_signature:', razorpay_signature);

    const signatureMatches = expectedSignature === razorpay_signature;
    console.log('[VerifyAPI] Signature match:', signatureMatches);
    if (!signatureMatches) {
      // Update payment status to failed
      console.log('[VerifyAPI] Signature mismatch. Marking payment FAILED for paymentId:', payment.id);
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          razorpayPaymentId: razorpay_payment_id,
          failureReason: 'Invalid signature verification',
        },
      });

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Start transaction to update payment and order
    const result = await prisma.$transaction(async (tx) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          razorpayPaymentId: razorpay_payment_id,
          transactionId: razorpay_payment_id,
        },
      });
      console.log('[VerifyAPI] Payment updated:', {
        id: updatedPayment.id,
        status: updatedPayment.status,
        transactionId: updatedPayment.transactionId,
      });

      // Update order status to confirmed and mark payment as completed
      const updatedOrder = await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED', paymentStatus: 'SUCCESS' },
      });
      console.log('[VerifyAPI] Order updated:', {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
      });

      // Add order tracking entry
      await tx.orderTracking.create({
        data: {
          orderId: payment.orderId,
          status: 'CONFIRMED',
          message: 'Payment verified successfully - Order confirmed',
        },
      });
      console.log('[VerifyAPI] OrderTracking entry created for order:', payment.orderId);

      // Convert reserved inventory to sold
      for (const item of payment.order.orderItems) {
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

      return { updatedPayment, updatedOrder };
    });

    // Clear cart after successful payment verification
    inMemoryCart[user.userId] = [];
    
    // Also clear cart from database
    await prisma.cartItem.deleteMany({
      where: { userId: user.userId }
    });
    console.log('[VerifyAPI] Cart cleared for user:', user.userId);

    // Fetch complete order data
    const completeOrder = await prisma.order.findUnique({
      where: { id: payment.orderId },
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
          take: 1,
        },
      },
    });

    // Send order confirmation email after successful payment
    try {
      const userDetails = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { name: true, email: true },
      });

      if (userDetails?.email) {
        const emailService = new EmailService();
        const estimatedDeliveryDate = new Date();
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 9);

        const orderData = {
          orderId: completeOrder?.orderNumber || payment.orderId,
          customerName: userDetails.name || 'Customer',
          totalAmount: completeOrder?.totalAmount || 0,
          subtotal: completeOrder?.subtotal ?? undefined,
          tax: completeOrder?.tax ?? undefined,
          shippingCost: completeOrder?.shippingCost ?? undefined,
          discount: completeOrder?.discount ?? undefined,
          estimatedDelivery: estimatedDeliveryDate.toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          }),
          shippingAddress: completeOrder?.shippingAddress
            ? `${completeOrder.shippingAddress.fullName}\n${completeOrder.shippingAddress.addressLine1}\n${completeOrder.shippingAddress.city}, ${completeOrder.shippingAddress.state} ${completeOrder.shippingAddress.pincode}`
            : 'Not available',
          items: (completeOrder?.orderItems || []).map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price,
            imageUrl: item.product.imageUrl || undefined,
          })),
          transactionId: result.updatedPayment.transactionId || undefined,
        };

        const emailSent = await emailService.sendOrderConfirmationEmail(userDetails.email, orderData);
        console.log('[VerifyAPI] Order confirmation email sent:', emailSent);
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation email after payment:', emailError);
    }

    // Create Shiprocket order after successful payment confirmation (idempotent)
    try {
      if (completeOrder && !completeOrder.shiprocketOrderId) {
        const userForShipping = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { name: true, email: true, phone: true },
        });

        if (userForShipping && completeOrder.shippingAddress) {
          const shiprocketOrderData = shiprocketService.formatOrderForShiprocket(
            completeOrder,
            userForShipping,
            completeOrder.shippingAddress
          );

          const shiprocketResponse = await shiprocketService.createOrder(shiprocketOrderData);

          await prisma.order.update({
            where: { id: completeOrder.id },
            data: {
              shiprocketOrderId: String(shiprocketResponse.order_id),
              awbCode: shiprocketResponse.awb_code || null,
              courierCompanyId: shiprocketResponse.courier_company_id || null,
              courierName: shiprocketResponse.courier_name || null,
              status: 'CONFIRMED',
            },
          });

          await prisma.orderTracking.create({
            data: {
              orderId: completeOrder.id,
              status: 'CONFIRMED',
              message: 'Shipping order created in Shiprocket',
            },
          });

          console.log('[VerifyAPI] Shiprocket order created:', shiprocketResponse.order_id);
        } else {
          console.warn('[VerifyAPI] Skipping Shiprocket creation: missing user or shipping address');
        }
      } else {
        console.log('[VerifyAPI] Shiprocket already linked for order:', completeOrder?.shiprocketOrderId);
      }
    } catch (shiprocketError) {
      console.error('Shiprocket creation failed after payment confirmation:', shiprocketError);
      // Do not fail payment verification on Shiprocket errors
    }

      console.log('[VerifyAPI] Verification completed successfully for payment:', result.updatedPayment.id);
      return NextResponse.json({
        message: 'Payment verified successfully',
        payment: {
          id: result.updatedPayment.id,
          status: result.updatedPayment.status,
          amount: result.updatedPayment.amount,
          transactionId: result.updatedPayment.transactionId,
        },
        order: completeOrder,
      });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

// GET /api/payments/verify - Get payment status
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
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
      },
      include: {
        order: {
          where: {
            userId: user.userId,
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!payment || !payment.order) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        method: payment.paymentMethod,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      order: payment.order,
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}