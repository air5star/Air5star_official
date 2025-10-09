import { NextRequest, NextResponse } from 'next/server';
import { updateProductSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';
import { productsData } from '@/data';

// GET /api/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Find product in static data
    let product = null;
    for (const category of productsData.categories) {
      const foundProduct = category.products.find(p => p.id === productId && p.isActive);
      if (foundProduct) {
        product = {
          ...foundProduct,
          category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            isActive: category.isActive,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
          }
        };
        break;
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Mock reviews data (since we don't have reviews in static data)
    const mockReviews = [];
    
    // Calculate average rating (using product rating from static data)
    const averageRating = product.rating || 0;

    // Check stock status (assuming static stock of 100)
    const stock = 100;
    const stockStatus = stock > 0 ? 'in_stock' : 'out_of_stock';

    const productWithDetails = {
      ...product,
      inventory: {
        id: 1,
        productId: product.id,
        stockQuantity: stock,
        reservedQuantity: 0,
        lowStockThreshold: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      reviews: mockReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: mockReviews.length,
      inStock: stock > 0,
    };

    return NextResponse.json(productWithDetails);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update a product (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Find product in static data
    let productFound = false;
    for (const category of productsData.categories) {
      const productIndex = category.products.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        productFound = true;
        break;
      }
    }

    if (!productFound) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // In a real implementation, you would update the static data
    // For now, we'll just return a success response with mock data
    const updatedProduct = {
      id: productId,
      ...validatedData,
      updatedAt: new Date().toISOString(),
      category: {
        id: 1,
        name: 'Sample Category',
        slug: 'sample-category'
      },
      inventory: {
        id: 1,
        productId: productId,
        stockQuantity: validatedData.stockQuantity || 100,
        reservedQuantity: 0,
        lowStockThreshold: validatedData.lowStockThreshold || 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Soft delete a product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Find product in static data
    let productFound = false;
    for (const category of productsData.categories) {
      const productIndex = category.products.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        productFound = true;
        break;
      }
    }

    if (!productFound) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // In a real implementation, you would update the static data to set isActive: false
    // For now, we'll just return a success response
    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}