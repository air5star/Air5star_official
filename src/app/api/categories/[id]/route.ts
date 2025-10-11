import { NextRequest, NextResponse } from 'next/server';
import { categorySchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';
import { productsData } from '@/data';

// GET /api/categories/[id] - Get a specific category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Find category in static data (productsData is an array)
    const category = productsData.find((c: any) => c.id === categoryId);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Static data does not track isActive; treat all as active
    const activeProducts = (category.products || []) as any[];
    let productsWithRatings = [];
    let totalProducts = activeProducts.length;
    let totalPages = Math.ceil(totalProducts / limit);

    if (includeProducts) {
      // Get paginated products
      const paginatedProducts = activeProducts.slice(skip, skip + limit);

      // Add ratings and stock info
      productsWithRatings = paginatedProducts.map(product => {
        const stock = 100; // Assuming static stock of 100
        
        return {
          ...product,
          inventory: {
            stockQuantity: stock,
            reservedQuantity: 0,
          },
          averageRating: (product as any).rating || 0,
          reviewCount: 0, // No reviews in static data
          inStock: stock > 0,
          availableStock: stock,
        };
      });
    }

    const response: any = {
      ...category,
      productCount: totalProducts,
    };

    if (includeProducts) {
      response.products = productsWithRatings;
      response.pagination = {
        page,
        limit,
        totalProducts,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update a category (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (simplified check)
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = categorySchema.partial().parse(body);

    // Check if category exists in static data
    const existingCategory = productsData.find((c: any) => c.id === categoryId);

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if name or slug conflicts with other categories
    if (validatedData.name || validatedData.slug) {
      const conflictingCategory = productsData.find((category: any) => 
        category.id !== categoryId && 
        (category.name === validatedData.name || category.slug === validatedData.slug)
      );

      if (conflictingCategory) {
        return NextResponse.json(
          { error: 'Category with this name or slug already exists' },
          { status: 400 }
        );
      }
    }

    // In a real implementation, you would update the static data
    // For now, we'll just return a success response with mock data
    const updatedCategory = {
      ...existingCategory,
      ...validatedData,
      updatedAt: new Date().toISOString(),
    };

    const activeProducts = (existingCategory.products || []) as any[];

    return NextResponse.json({
      message: 'Category updated successfully',
      category: {
        ...updatedCategory,
        productCount: activeProducts.length,
      },
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete a category (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (simplified check)
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check if category exists in static data
    const existingCategory = productsData.find((c: any) => c.id === categoryId);

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has products
    const productCount = existingCategory.products.length;
    if (productCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category that contains products',
          productCount: productCount
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would remove the category from static data
    // For now, we'll just return a success response
    return NextResponse.json({
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}