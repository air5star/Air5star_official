import { NextRequest, NextResponse } from 'next/server';
import { productsData } from '@/data';
import crypto from 'crypto';

// Interface for Tidio webhook payload
interface TidioWebhookPayload {
  event: string;
  visitor_id: string;
  message: {
    content: string;
    type: 'text' | 'image' | 'file';
    timestamp: number;
  };
  conversation_id: string;
}

// Interface for product search response
interface ProductSearchResponse {
  products: Array<{
    id: string;
    name: string;
    price: number;
    mrp: number;
    imageUrl: string;
    category: string;
    brand: string;
    description: string;
  }>;
  total: number;
}

// Verify HMAC signature for webhook security
function verifyHMACSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Search products based on user query
function searchProducts(query: string): ProductSearchResponse {
  const searchTerm = query.toLowerCase();
  let allProducts: any[] = [];
  
  // Flatten all products from all categories
  for (const categoryData of productsData) {
    if (categoryData.products) {
      const categoryProducts = categoryData.products.map(product => ({
        id: product.id.toString(),
        name: product.productTitle || product.name,
        price: product.price,
        mrp: product.mrp,
        imageUrl: product.imageUrl,
        category: product.category,
        brand: product.brand || 'Generic',
        description: product.description || `High-quality ${product.name}`,
      }));
      allProducts = [...allProducts, ...categoryProducts];
    }
  }
  
  // Filter products based on search term
  const filteredProducts = allProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm) ||
    product.brand.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm)
  );
  
  // Limit to top 5 results for chatbot
  const limitedProducts = filteredProducts.slice(0, 5);
  
  return {
    products: limitedProducts,
    total: filteredProducts.length
  };
}

// Generate chatbot response based on user message
function generateChatbotResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Check for product search intent
  if (lowerMessage.includes('search') || lowerMessage.includes('find') || 
      lowerMessage.includes('looking for') || lowerMessage.includes('need')) {
    
    // Extract potential product keywords
    const keywords = ['ac', 'air conditioner', 'ventilation', 'cooling', 'heating', 'hvac'];
    const foundKeyword = keywords.find(keyword => lowerMessage.includes(keyword));
    
    if (foundKeyword) {
      const searchResults = searchProducts(foundKeyword);
      
      if (searchResults.products.length > 0) {
        let response = `I found ${searchResults.total} products related to "${foundKeyword}". Here are the top matches:\n\n`;
        
        searchResults.products.forEach((product, index) => {
          response += `${index + 1}. **${product.name}**\n`;
          response += `   Price: ₹${product.price.toLocaleString()} (MRP: ₹${product.mrp.toLocaleString()})\n`;
          response += `   Category: ${product.category}\n`;
          response += `   Brand: ${product.brand}\n\n`;
        });
        
        response += 'Would you like more details about any of these products?';
        return response;
      } else {
        return `I couldn't find any products matching "${foundKeyword}". Could you try a different search term?`;
      }
    }
  }
  
  // Default responses for common queries
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return 'Hello! Welcome to Air5Star. I can help you find the perfect HVAC products. What are you looking for today?';
  }
  
  if (lowerMessage.includes('help')) {
    return 'I\'m here to help! You can ask me to:\n• Search for products ("find air conditioners")\n• Get product recommendations\n• Check prices and availability\n• Learn about our services\n\nWhat would you like to know?';
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return 'I can help you find products within your budget. Please tell me what type of product you\'re looking for and your price range.';
  }
  
  // Default response
  return 'Thank you for your message! I can help you find HVAC products, check prices, and answer questions about our services. How can I assist you today?';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload: TidioWebhookPayload = JSON.parse(body);
    
    // Verify HMAC signature if secret is provided
    const tidioSecret = process.env.TIDIO_WEBHOOK_SECRET;
    if (tidioSecret) {
      const signature = request.headers.get('x-tidio-signature');
      if (!signature || !verifyHMACSignature(body, signature, tidioSecret)) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { 
            status: 401,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tidio-signature'
            }
          }
        );
      }
    }
    
    // Only process visitor messages
    if (payload.event !== 'message_sent' || payload.message.type !== 'text') {
      return NextResponse.json(
        { success: true },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tidio-signature'
          }
        }
      );
    }
    
    const userMessage = payload.message.content;
    const response = generateChatbotResponse(userMessage);
    
    // Return response for Tidio to send back to user
    return NextResponse.json({
      success: true,
      response: {
        type: 'text',
        content: response,
        conversation_id: payload.conversation_id
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tidio-signature'
      }
    });
    
  } catch (error) {
    console.error('Tidio webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tidio-signature'
        }
      }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'tidio-webhook',
    timestamp: new Date().toISOString()
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tidio-signature'
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tidio-signature'
    }
  });
}