import { NextRequest, NextResponse } from 'next/server';
import { categorySchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';
import { productsData } from '@/data';

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';
    const isActive = searchParams.get('isActive');

    // Filter categories from static data
    let categories = productsData.categories;
    
    if (isActive !== null) {
      categories = categories.filter(category => 
        category.isActive === (isActive === 'true')
      );
    }

    // Map categories with products and counts
    const categoriesWithCount = categories.map(category => {
      const activeProducts = category.products.filter(p => p.isActive);
      
      return {
        ...category,
        products: includeProducts ? activeProducts.slice(0, 10).map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          mrp: product.mrp,
          imageUrl: product.imageUrl,
          sku: product.sku,
        })) : undefined,
        productCount: activeProducts.length,
      };
    });

    // Sort by name
    categoriesWithCount.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      categories: categoriesWithCount,
      totalCategories: categoriesWithCount.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category (Admin only)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    // Check if category with same name or slug already exists in static data
    const existingCategory = productsData.categories.find(category => 
      category.name === validatedData.name || category.slug === validatedData.slug
    );

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name or slug already exists' },
        { status: 400 }
      );
    }

    // In a real implementation, you would add the category to static data
    // For now, we'll just return a success response with mock data
    const newCategory = {
      id: Math.max(...productsData.categories.map(c => c.id)) + 1,
      ...validatedData,
      products: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        message: 'Category created successfully',
        category: newCategory,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}