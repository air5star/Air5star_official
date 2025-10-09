import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

interface ShiprocketWebhookPayload {
  order_id: string;
  shipment_id: number;
  awb: string;
  courier_company_id: number;
  courier_name: string;
  current_status: string;
  delivered_date?: string;
  pickup_date?: string;
  shipped_date?: string;
  rto_date?: string;
  expected_delivery_date?: string;
  track_url?: string;
  scans?: Array<{
    date: string;
    activity: string;
    location: string;
    status: string;
  }>;
}

// Shiprocket status mapping to our order status
const statusMapping: Record<string, string> = {
  'Shipped': 'SHIPPED',
  'Out for Delivery': 'OUT_FOR_DELIVERY',
  'Delivered': 'DELIVERED',
  'RTO Initiated': 'RTO_INITIATED',
  'RTO Delivered': 'RTO_DELIVERED',
  'Lost': 'LOST',
  'Damaged': 'DAMAGED',
  'Cancelled': 'CANCELLED',
  'Exception': 'EXCEPTION',
  'Undelivered': 'UNDELIVERED',
  'Pickup Error': 'PICKUP_ERROR',
  'Pickup Rescheduled': 'PICKUP_RESCHEDULED',
  'In Transit': 'IN_TRANSIT',
  'Reached at Destination': 'REACHED_DESTINATION',
};

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('SHIPROCKET_WEBHOOK_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-shiprocket-signature');

    // Verify webhook signature for security
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload: ShiprocketWebhookPayload = JSON.parse(body);
    console.log('Received Shiprocket webhook:', payload);

    // Find the order by order_id (which should be our orderNumber)
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: payload.order_id,
      },
      include: {
        shipmentTracking: true,
      },
    });

    if (!order) {
      console.error(`Order not found for order_id: ${payload.order_id}`);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Map Shiprocket status to our order status
    const mappedStatus = statusMapping[payload.current_status] || 'PROCESSING';

    // Update order with shipping information
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: mappedStatus,
        awbCode: payload.awb,
        courierCompanyId: payload.courier_company_id,
        courierName: payload.courier_name,
        trackingUrl: payload.track_url,
        updatedAt: new Date(),
      },
    });

    // Create or update shipment tracking record
    const trackingData = {
      orderId: order.id,
      status: payload.current_status,
      statusCode: payload.courier_company_id,
      statusDate: new Date(),
      location: payload.scans?.[0]?.location || '',
      remarks: payload.scans?.[0]?.activity || payload.current_status,
      courierName: payload.courier_name,
      awbCode: payload.awb,
    };

    // Check if tracking record exists
    const existingTracking = await prisma.shipmentTracking.findFirst({
      where: {
        orderId: order.id,
        awbCode: payload.awb,
      },
    });

    if (existingTracking) {
      await prisma.shipmentTracking.update({
        where: { id: existingTracking.id },
        data: trackingData,
      });
    } else {
      await prisma.shipmentTracking.create({
        data: trackingData,
      });
    }

    // Create tracking entries for all scans if available
    if (payload.scans && payload.scans.length > 0) {
      for (const scan of payload.scans) {
        await prisma.shipmentTracking.upsert({
          where: {
            orderId_awbCode_statusDate: {
              orderId: order.id,
              awbCode: payload.awb,
              statusDate: new Date(scan.date),
            },
          },
          update: {
            status: scan.status,
            location: scan.location,
            remarks: scan.activity,
          },
          create: {
            orderId: order.id,
            status: scan.status,
            statusCode: payload.courier_company_id,
            statusDate: new Date(scan.date),
            location: scan.location,
            remarks: scan.activity,
            courierName: payload.courier_name,
            awbCode: payload.awb,
          },
        });
      }
    }

    console.log(`Order ${payload.order_id} updated with status: ${mappedStatus}`);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      orderId: order.id,
      status: mappedStatus,
    });

  } catch (error) {
    console.error('Error processing Shiprocket webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ 
    message: 'Shiprocket webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}