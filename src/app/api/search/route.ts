import { NextRequest, NextResponse } from 'next/server';
import { productsData } from '@/data';
import { z } from 'zod';

// Validation schema for search parameters
const searchSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0),
  category: z.string().optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  sort_by: z.enum(['relevance', 'price_asc', 'price_desc', 'name']).default('relevance'),
  autocomplete: z.coerce.boolean().default(false)
});

// Interface for search results
interface SearchResult {
  id: string;
  name: string;
  price: number;
  mrp: number;
  imageUrl: string;
  category: string;
  brand: string;
  description: string;
  highlights?: {
    name?: string;
    description?: string;
    category?: string;
  };
  relevance_score?: number;
}

interface AutocompleteResult {
  suggestions: string[];
  categories: string[];
  brands: string[];
}

// Flatten all products from categories
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
      }));
      allProducts = [...allProducts, ...categoryProducts];
    }
  }
  
  return allProducts;
}

// Calculate relevance score based on query match
function calculateRelevanceScore(product: any, query: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerName = product.name.toLowerCase();
  const lowerCategory = product.category.toLowerCase();
  const lowerBrand = product.brand.toLowerCase();
  const lowerDescription = product.description.toLowerCase();
  
  let score = 0;
  
  // Exact name match gets highest score
  if (lowerName === lowerQuery) score += 100;
  // Name starts with query
  else if (lowerName.startsWith(lowerQuery)) score += 80;
  // Name contains query
  else if (lowerName.includes(lowerQuery)) score += 60;
  
  // Category matches
  if (lowerCategory === lowerQuery) score += 50;
  else if (lowerCategory.includes(lowerQuery)) score += 30;
  
  // Brand matches
  if (lowerBrand === lowerQuery) score += 40;
  else if (lowerBrand.includes(lowerQuery)) score += 20;
  
  // Description contains query
  if (lowerDescription.includes(lowerQuery)) score += 10;
  
  return score;
}

// Highlight matching text
function highlightText(text: string, query: string): string {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Search products with filtering and sorting
function searchProducts(params: z.infer<typeof searchSchema>): {
  results: SearchResult[];
  total: number;
  facets: {
    categories: { [key: string]: number };
    brands: { [key: string]: number };
    price_ranges: { [key: string]: number };
  };
} {
  const allProducts = getAllProducts();
  const { q, limit, offset, category, min_price, max_price, sort_by } = params;
  
  // Filter products based on query and filters
  let filteredProducts = allProducts.filter(product => {
    const matchesQuery = 
      product.name.toLowerCase().includes(q.toLowerCase()) ||
      product.category.toLowerCase().includes(q.toLowerCase()) ||
      product.brand.toLowerCase().includes(q.toLowerCase()) ||
      product.description.toLowerCase().includes(q.toLowerCase());
    
    const matchesCategory = !category || product.category.toLowerCase() === category.toLowerCase();
    const matchesMinPrice = !min_price || product.price >= min_price;
    const matchesMaxPrice = !max_price || product.price <= max_price;
    
    return matchesQuery && matchesCategory && matchesMinPrice && matchesMaxPrice;
  });
  
  // Calculate relevance scores and add highlights
  const resultsWithScores: SearchResult[] = filteredProducts.map(product => ({
    ...product,
    relevance_score: calculateRelevanceScore(product, q),
    highlights: {
      name: highlightText(product.name, q),
      description: highlightText(product.description, q),
      category: highlightText(product.category, q),
    }
  }));
  
  // Sort results
  resultsWithScores.sort((a, b) => {
    switch (sort_by) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'relevance':
      default:
        return (b.relevance_score || 0) - (a.relevance_score || 0);
    }
  });
  
  // Calculate facets
  const facets = {
    categories: {} as { [key: string]: number },
    brands: {} as { [key: string]: number },
    price_ranges: {
      '0-1000': 0,
      '1000-5000': 0,
      '5000-10000': 0,
      '10000+': 0
    }
  };
  
  filteredProducts.forEach(product => {
    // Count categories
    facets.categories[product.category] = (facets.categories[product.category] || 0) + 1;
    
    // Count brands
    facets.brands[product.brand] = (facets.brands[product.brand] || 0) + 1;
    
    // Count price ranges
    if (product.price < 1000) facets.price_ranges['0-1000']++;
    else if (product.price < 5000) facets.price_ranges['1000-5000']++;
    else if (product.price < 10000) facets.price_ranges['5000-10000']++;
    else facets.price_ranges['10000+']++;
  });
  
  // Paginate results
  const paginatedResults = resultsWithScores.slice(offset, offset + limit);
  
  return {
    results: paginatedResults,
    total: filteredProducts.length,
    facets
  };
}

// Generate autocomplete suggestions
function getAutocompleteSuggestions(query: string): AutocompleteResult {
  const allProducts = getAllProducts();
  const lowerQuery = query.toLowerCase();
  
  const suggestions = new Set<string>();
  const categories = new Set<string>();
  const brands = new Set<string>();
  
  allProducts.forEach(product => {
    // Add product name suggestions
    if (product.name.toLowerCase().includes(lowerQuery)) {
      suggestions.add(product.name);
    }
    
    // Add category suggestions
    if (product.category.toLowerCase().includes(lowerQuery)) {
      categories.add(product.category);
    }
    
    // Add brand suggestions
    if (product.brand.toLowerCase().includes(lowerQuery)) {
      brands.add(product.brand);
    }
  });
  
  return {
    suggestions: Array.from(suggestions).slice(0, 8),
    categories: Array.from(categories).slice(0, 5),
    brands: Array.from(brands).slice(0, 5)
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchSchema.parse(Object.fromEntries(searchParams));
    
    // Handle autocomplete requests
    if (params.autocomplete) {
      const autocompleteResults = getAutocompleteSuggestions(params.q);
      return NextResponse.json({
        success: true,
        data: autocompleteResults,
        query: params.q
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Handle full search requests
    const searchResults = searchProducts(params);
    
    return NextResponse.json({
      success: true,
      data: {
        products: searchResults.results,
        total: searchResults.total,
        facets: searchResults.facets,
        pagination: {
          limit: params.limit,
          offset: params.offset,
          has_more: searchResults.total > params.offset + params.limit
        }
      },
      query: params.q,
      filters: {
        category: params.category,
        min_price: params.min_price,
        max_price: params.max_price,
        sort_by: params.sort_by
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
    
    console.error('Search API error:', error);
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