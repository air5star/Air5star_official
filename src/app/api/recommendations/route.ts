import { NextRequest, NextResponse } from 'next/server';
import { productsData } from '@/data';
import { z } from 'zod';

// Validation schema for recommendations parameters
const recommendationsSchema = z.object({
  user_id: z.string().optional(),
  product_id: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(20).default(8),
  type: z.enum(['similar', 'trending', 'personalized', 'category']).default('similar')
});

// Interface for recommendation result
interface RecommendationResult {
  id: string;
  name: string;
  price: number;
  mrp: number;
  imageUrl: string;
  category: string;
  brand: string;
  description: string;
  score: number;
  reason: string;
}

// Get all products flattened
function getAllProducts() {
  let allProducts: any[] = [];
  
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
        tags: product.tags || [],
        rating: product.rating || 4.0,
        reviews: product.reviews || 0
      }));
      allProducts = [...allProducts, ...categoryProducts];
    }
  }
  
  return allProducts;
}

// Get similar products based on category and price range
function getSimilarProducts(productId: string, limit: number): RecommendationResult[] {
  const allProducts = getAllProducts();
  const targetProduct = allProducts.find(p => p.id === productId);
  
  if (!targetProduct) {
    return getTrendingProducts(limit);
  }
  
  const priceRange = targetProduct.price * 0.3; // 30% price variance
  
  const similarProducts = allProducts
    .filter(product => 
      product.id !== productId &&
      product.category === targetProduct.category &&
      Math.abs(product.price - targetProduct.price) <= priceRange
    )
    .map(product => ({
      ...product,
      score: calculateSimilarityScore(product, targetProduct),
      reason: `Similar to ${targetProduct.name}`
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  // If not enough similar products, fill with category products
  if (similarProducts.length < limit) {
    const categoryProducts = allProducts
      .filter(product => 
        product.id !== productId &&
        product.category === targetProduct.category &&
        !similarProducts.find(sp => sp.id === product.id)
      )
      .map(product => ({
        ...product,
        score: 50,
        reason: `From ${product.category} category`
      }))
      .slice(0, limit - similarProducts.length);
    
    similarProducts.push(...categoryProducts);
  }
  
  return similarProducts;
}

// Calculate similarity score between two products
function calculateSimilarityScore(product1: any, product2: any): number {
  let score = 0;
  
  // Same category bonus
  if (product1.category === product2.category) score += 40;
  
  // Same brand bonus
  if (product1.brand === product2.brand) score += 30;
  
  // Price similarity (closer prices get higher scores)
  const priceDiff = Math.abs(product1.price - product2.price);
  const maxPrice = Math.max(product1.price, product2.price);
  const priceScore = Math.max(0, 30 - (priceDiff / maxPrice) * 30);
  score += priceScore;
  
  // Rating similarity
  const ratingDiff = Math.abs((product1.rating || 4) - (product2.rating || 4));
  score += Math.max(0, 20 - ratingDiff * 5);
  
  return Math.round(score);
}

// Get trending products (highest rated with most reviews)
function getTrendingProducts(limit: number): RecommendationResult[] {
  const allProducts = getAllProducts();
  
  return allProducts
    .map(product => ({
      ...product,
      score: (product.rating || 4) * 20 + Math.min((product.reviews || 0) / 10, 20),
      reason: 'Trending product'
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Get products from specific category
function getCategoryProducts(category: string, limit: number): RecommendationResult[] {
  const allProducts = getAllProducts();
  
  return allProducts
    .filter(product => product.category.toLowerCase() === category.toLowerCase())
    .map(product => ({
      ...product,
      score: (product.rating || 4) * 15 + (product.reviews || 0) / 5,
      reason: `Popular in ${product.category}`
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Get personalized recommendations (mock implementation)
function getPersonalizedProducts(userId: string, limit: number): RecommendationResult[] {
  // In a real implementation, this would use user behavior data from Redis/database
  // For now, we'll return a mix of trending and category-based recommendations
  
  const allProducts = getAllProducts();
  const categories = ['air-conditioning', 'ventilation', 'cooling'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  const personalizedProducts = allProducts
    .filter(product => product.category.toLowerCase().includes(randomCategory))
    .map(product => ({
      ...product,
      score: Math.random() * 100, // Mock personalization score
      reason: 'Recommended for you'
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return personalizedProducts;
}

// Main recommendation engine
function getRecommendations(params: z.infer<typeof recommendationsSchema>): RecommendationResult[] {
  const { user_id, product_id, category, limit, type } = params;
  
  switch (type) {
    case 'similar':
      if (product_id) {
        return getSimilarProducts(product_id, limit);
      }
      return getTrendingProducts(limit);
      
    case 'trending':
      return getTrendingProducts(limit);
      
    case 'personalized':
      if (user_id) {
        return getPersonalizedProducts(user_id, limit);
      }
      return getTrendingProducts(limit);
      
    case 'category':
      if (category) {
        return getCategoryProducts(category, limit);
      }
      return getTrendingProducts(limit);
      
    default:
      return getTrendingProducts(limit);
  }
}

// Track user interaction (for future personalization)
async function trackUserInteraction(userId: string, productId: string, action: string) {
  // In a real implementation, this would store data in Redis or database
  // For now, we'll just log it
  console.log(`User ${userId} performed ${action} on product ${productId}`);
  
  // Future implementation would store in Redis:
  // await redis.zadd(`user:${userId}:views`, Date.now(), productId);
  // await redis.zadd(`user:${userId}:${action}`, Date.now(), productId);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = recommendationsSchema.parse(Object.fromEntries(searchParams));
    
    const recommendations = getRecommendations(params);
    
    // Track the recommendation request for analytics
    if (params.user_id) {
      await trackUserInteraction(params.user_id, 'recommendation_request', 'view');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
        type: params.type,
        metadata: {
          user_id: params.user_id,
          product_id: params.product_id,
          category: params.category,
          generated_at: new Date().toISOString()
        }
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
          error: 'Invalid parameters',
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
    
    console.error('Recommendations API error:', error);
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

// POST endpoint for tracking user interactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, product_id, action } = body;
    
    if (!user_id || !product_id || !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: user_id, product_id, action'
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
    
    await trackUserInteraction(user_id, product_id, action);
    
    return NextResponse.json({
      success: true,
      message: 'Interaction tracked successfully'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error) {
    console.error('Track interaction error:', error);
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