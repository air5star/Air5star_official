import { NextRequest, NextResponse } from 'next/server';
import { productSearchSchema, productSchema } from '@/lib/validations';
import { getUserFromRequest, generateSKU } from '@/lib/auth-utils';
import { productsData } from '@/data';

// GET /api/products - Get all products with search, filter, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const queryParams = {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      sortBy: searchParams.get('sortBy') || 'created_desc',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    };

    const validatedParams = productSearchSchema.parse(queryParams);
    const { q, category, brand, minPrice, maxPrice, sortBy, page, limit } = validatedParams;

    // Flatten all products from all categories
    let allProducts: any[] = [];
    for (const categoryData of productsData) {
      if (categoryData.products) {
        const categoryProducts = categoryData.products.map(product => ({
          id: product.id.toString(),
          name: product.productTitle || product.name,
          description: product.description || `High-quality ${product.name}`,
          price: product.price,
          mrp: product.mrp,
          imageUrl: product.imageUrl,
          brand: product.brand || 'Generic',
          sku: product.sku || `SKU-${product.id}`,
          isActive: true,
          category: {
            id: categoryData.id?.toString() || '1',
            name: product.category,
            slug: product.category.toLowerCase().replace(/\s+/g, '-'),
          },
          inventory: {
            stockQuantity: 100,
            reservedQuantity: 0,
          },
          averageRating: 4.5,
          reviewCount: 10,
          inStock: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
        }));
        allProducts = allProducts.concat(categoryProducts);
      }
    }

    // Apply filters
    let filteredProducts = allProducts;

    if (q) {
      const searchTerm = q.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm)
      );
    }

    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.slug === category
      );
    }

    if (brand) {
      filteredProducts = filteredProducts.filter(product => 
        product.brand.toLowerCase().includes(brand.toLowerCase())
      );
    }

    if (minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => product.price >= minPrice);
    }

    if (maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => product.price <= maxPrice);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        filteredProducts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Apply pagination
    const totalCount = filteredProducts.length;
    const skip = (page - 1) * limit;
    const productsWithRatings = filteredProducts.slice(skip, skip + limit);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      products: productsWithRatings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
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

// HEAD /api/products - Health check
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

// OPTIONS /api/products - Handle preflight requests
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

// POST /api/products - Create a new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    const body = await request.json();
    const validatedData = productSchema.parse(body);
    
    const { stockQuantity, lowStockThreshold, ...productData } = validatedData;

    // Generate SKU if not provided
    if (!productData.sku) {
      productData.sku = generateSKU(
        productData.categoryId,
        productData.brand || 'GENERIC'
      );
    }

    // Create product with inventory
    const product = await prisma.product.create({
      data: {
        ...productData,
        inventory: {
          create: {
            stockQuantity: stockQuantity || 0,
            lowStockThreshold: lowStockThreshold || 5,
          },
        },
      },
      include: {
        category: true,
        inventory: true,
      },
    });

    return NextResponse.json(product, { 
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
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