import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schemas
const abandonedCartSchema = z.object({
  user_id: z.string().min(1),
  email: z.string().email(),
  cart_items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    imageUrl: z.string().url()
  })),
  cart_total: z.number().min(0),
  abandoned_at: z.string().datetime().optional()
});

const emailSequenceSchema = z.object({
  user_id: z.string().min(1),
  sequence_type: z.enum(['immediate', 'reminder_1h', 'reminder_24h', 'final_48h']),
  cart_recovery_token: z.string().optional()
});

// Interface for abandoned cart data
interface AbandonedCartData {
  user_id: string;
  email: string;
  cart_items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
  }>;
  cart_total: number;
  abandoned_at: string;
  recovery_token: string;
}

// Interface for email template data
interface EmailTemplateData {
  user_name: string;
  cart_items: any[];
  cart_total: number;
  recovery_url: string;
  discount_code?: string;
  discount_percentage?: number;
}

// Generate cart recovery token
function generateRecoveryToken(userId: string, cartData: string): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const timestamp = Date.now().toString();
  const payload = `${userId}:${timestamp}:${cartData}`;
  
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex') + '.' + timestamp;
}

// Verify recovery token
function verifyRecoveryToken(token: string, userId: string): boolean {
  try {
    const [hash, timestamp] = token.split('.');
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    
    // Check if token is not older than 7 days
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 7 * 24 * 60 * 60 * 1000) {
      return false;
    }
    
    // Verify hash (simplified - in production, include cart data)
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(`${userId}:${timestamp}:cart_data`)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  } catch {
    return false;
  }
}

// Generate discount code for cart recovery
function generateDiscountCode(userId: string): { code: string; percentage: number } {
  const codes = [
    { code: 'COMEBACK10', percentage: 10 },
    { code: 'SAVE15', percentage: 15 },
    { code: 'RETURN20', percentage: 20 }
  ];
  
  // Use user ID to consistently generate the same discount
  const index = parseInt(userId.slice(-1)) % codes.length;
  return codes[index];
}

// Send email via MailerLite API
async function sendMailerLiteEmail(
  email: string,
  templateData: EmailTemplateData,
  sequenceType: string
): Promise<boolean> {
  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;
  
  if (!apiKey) {
    console.log('MailerLite API key not configured, skipping email send');
    return false;
  }
  
  try {
    // First, add/update subscriber
    const subscriberResponse = await fetch('https://api.mailerlite.com/api/v2/subscribers', {
      method: 'POST',
      headers: {
        'X-MailerLite-ApiKey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        name: templateData.user_name,
        fields: {
          cart_total: templateData.cart_total.toString(),
          cart_items_count: templateData.cart_items.length.toString(),
          recovery_url: templateData.recovery_url,
          discount_code: templateData.discount_code || '',
          sequence_type: sequenceType
        },
        groups: groupId ? [groupId] : undefined
      })
    });
    
    if (!subscriberResponse.ok) {
      console.error('Failed to add subscriber to MailerLite:', await subscriberResponse.text());
      return false;
    }
    
    // Send campaign email (simplified - in production, use automation workflows)
    const campaignResponse = await fetch('https://api.mailerlite.com/api/v2/campaigns', {
      method: 'POST',
      headers: {
        'X-MailerLite-ApiKey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'regular',
        subject: getEmailSubject(sequenceType),
        from: process.env.FROM_EMAIL || 'noreply@air5star.com',
        from_name: 'Air5Star',
        groups: groupId ? [groupId] : undefined,
        content: generateEmailHTML(templateData, sequenceType)
      })
    });
    
    return campaignResponse.ok;
    
  } catch (error) {
    console.error('MailerLite email error:', error);
    return false;
  }
}

// Get email subject based on sequence type
function getEmailSubject(sequenceType: string): string {
  switch (sequenceType) {
    case 'immediate':
      return 'You left something in your cart!';
    case 'reminder_1h':
      return 'Still thinking about your HVAC purchase?';
    case 'reminder_24h':
      return 'Don\'t miss out on these great products!';
    case 'final_48h':
      return 'Last chance - Special discount inside!';
    default:
      return 'Complete your purchase at Air5Star';
  }
}

// Generate email HTML content
function generateEmailHTML(data: EmailTemplateData, sequenceType: string): string {
  const { user_name, cart_items, cart_total, recovery_url, discount_code, discount_percentage } = data;
  
  const itemsHTML = cart_items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong><br>
        <small>Quantity: ${item.quantity}</small>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₹${(item.price * item.quantity).toLocaleString()}
      </td>
    </tr>
  `).join('');
  
  const discountHTML = discount_code ? `
    <div style="background: #f0f9ff; border: 2px dashed #0ea5e9; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px;">
      <h3 style="color: #0ea5e9; margin: 0 0 10px 0;">Special Offer Just for You!</h3>
      <p style="margin: 0 0 10px 0;">Use code <strong style="font-size: 18px; color: #dc2626;">${discount_code}</strong> for ${discount_percentage}% off your order!</p>
      <small style="color: #666;">Valid for 48 hours only</small>
    </div>
  ` : '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${getEmailSubject(sequenceType)}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo-Air5Star.png" alt="Air5Star" style="height: 60px;">
      </div>
      
      <h1 style="color: #111184; text-align: center;">${getEmailSubject(sequenceType)}</h1>
      
      <p>Hi ${user_name},</p>
      
      <p>${getEmailMessage(sequenceType)}</p>
      
      ${discountHTML}
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your Cart Items:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHTML}
          <tr>
            <td colspan="2" style="padding: 15px 10px; font-weight: bold; border-top: 2px solid #111184;">Total:</td>
            <td style="padding: 15px 10px; font-weight: bold; text-align: right; border-top: 2px solid #111184;">₹${cart_total.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${recovery_url}" style="background: #111184; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Complete Your Purchase</a>
      </div>
      
      <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
        <p>This email was sent because you have items in your cart at Air5Star.</p>
        <p>If you no longer wish to receive these emails, <a href="#" style="color: #111184;">unsubscribe here</a>.</p>
        <p>Air5Star - Your trusted HVAC partner</p>
      </div>
    </body>
    </html>
  `;
}

// Get email message based on sequence type
function getEmailMessage(sequenceType: string): string {
  switch (sequenceType) {
    case 'immediate':
      return 'We noticed you left some great HVAC products in your cart. Don\'t let them get away!';
    case 'reminder_1h':
      return 'Your cart is waiting for you! These premium HVAC products are still available and ready to ship.';
    case 'reminder_24h':
      return 'Your cart items are still reserved, but they won\'t wait forever. Complete your purchase today!';
    case 'final_48h':
      return 'This is your final reminder! We\'ve added a special discount to help you complete your purchase.';
    default:
      return 'Complete your purchase and get the best HVAC products delivered to your door.';
  }
}

// Store abandoned cart data (in production, use Redis or database)
const abandonedCarts = new Map<string, AbandonedCartData>();

// Schedule email sequence (in production, use a job queue like Bull or Agenda)
function scheduleEmailSequence(cartData: AbandonedCartData) {
  const sequences = [
    { type: 'immediate', delay: 0 },
    { type: 'reminder_1h', delay: 60 * 60 * 1000 }, // 1 hour
    { type: 'reminder_24h', delay: 24 * 60 * 60 * 1000 }, // 24 hours
    { type: 'final_48h', delay: 48 * 60 * 60 * 1000 } // 48 hours
  ];
  
  sequences.forEach(({ type, delay }) => {
    setTimeout(async () => {
      const currentCart = abandonedCarts.get(cartData.user_id);
      if (currentCart && currentCart.abandoned_at === cartData.abandoned_at) {
        const discount = type === 'final_48h' ? generateDiscountCode(cartData.user_id) : undefined;
        
        const templateData: EmailTemplateData = {
          user_name: cartData.email.split('@')[0], // Fallback name
          cart_items: cartData.cart_items,
          cart_total: cartData.cart_total,
          recovery_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cart?recovery=${cartData.recovery_token}`,
          discount_code: discount?.code,
          discount_percentage: discount?.percentage
        };
        
        await sendMailerLiteEmail(cartData.email, templateData, type);
      }
    }, delay);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cartData = abandonedCartSchema.parse(body);
    
    // Generate recovery token
    const recovery_token = generateRecoveryToken(
      cartData.user_id,
      JSON.stringify(cartData.cart_items)
    );
    
    // Store abandoned cart data
    const abandonedCartData: AbandonedCartData = {
      ...cartData,
      abandoned_at: cartData.abandoned_at || new Date().toISOString(),
      recovery_token
    };
    
    abandonedCarts.set(cartData.user_id, abandonedCartData);
    
    // Schedule email sequence
    scheduleEmailSequence(abandonedCartData);
    
    return NextResponse.json({
      success: true,
      message: 'Abandoned cart workflow initiated',
      recovery_token,
      data: {
        user_id: cartData.user_id,
        scheduled_emails: 4,
        recovery_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cart?recovery=${recovery_token}`
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    console.error('Abandoned cart API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}

// GET endpoint to retrieve abandoned cart data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recovery_token = searchParams.get('recovery_token');
    const user_id = searchParams.get('user_id');
    
    if (!recovery_token || !user_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing recovery_token or user_id'
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Verify token
    if (!verifyRecoveryToken(recovery_token, user_id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired recovery token'
        },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Get cart data
    const cartData = abandonedCarts.get(user_id);
    
    if (!cartData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cart data not found'
        },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        cart_items: cartData.cart_items,
        cart_total: cartData.cart_total,
        abandoned_at: cartData.abandoned_at,
        discount: generateDiscountCode(user_id)
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error) {
    console.error('Get abandoned cart error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}

// Health check
export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}