import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';

const updateInventorySchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  reservedQuantity: z.number().int().min(0, 'Reserved quantity must be non-negative').optional(),
  lowStockThreshold: z.number().int().min(0, 'Low stock threshold must be non-negative').optional(),
});

const bulkUpdateSchema = z.object({
  updates: z.array(updateInventorySchema),
});

// GET /api/admin/inventory - Get inventory overview
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const stockStatus = searchParams.get('stockStatus'); // 'low', 'out', 'available'
    const skip = (page - 1) * limit;

    // Build where clause for products
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Get products with inventory
    let products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        inventory: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Filter by stock status if specified
    if (stockStatus) {
      products = products.filter((product: { inventory: { quantity: number; reservedQuantity: number; lowStockThreshold: number } | null }) => {
        if (!product.inventory) return false;
        
        const availableStock = product.inventory.quantity - product.inventory.reservedQuantity;
        
        switch (stockStatus) {
          case 'out':
            return availableStock <= 0;
          case 'low':
            return availableStock > 0 && availableStock <= product.inventory.lowStockThreshold;
          case 'available':
            return availableStock > product.inventory.lowStockThreshold;
          default:
            return true;
        }
      });
    }

    const totalCount = await prisma.product.count({ where });

    // Calculate inventory statistics
    const inventoryStats = await prisma.inventory.aggregate({
      _sum: {
        quantity: true,
        reservedQuantity: true,
      },
      _count: {
        id: true,
      },
    });

    // Get low stock and out of stock counts
    const allInventory = await prisma.inventory.findMany({
      include: {
        product: {
          select: {
            isActive: true,
          },
        },
      },
    });

    const activeInventory = allInventory.filter((inv: { product: { isActive: boolean } }) => inv.product.isActive);
    
    const lowStockCount = activeInventory.filter(
      (inv: { quantity: number; reservedQuantity: number; lowStockThreshold: number }) => {
        const available = inv.quantity - inv.reservedQuantity;
        return available > 0 && available <= inv.lowStockThreshold;
      }
    ).length;

    const outOfStockCount = activeInventory.filter(
      (inv: { quantity: number; reservedQuantity: number }) => (inv.quantity - inv.reservedQuantity) <= 0
    ).length;

    // Format products with calculated stock status
    const formattedProducts = products.map((product: { id: string; name: string; sku: string; price: number; category: { id: string; name: string | null } | null; inventory: { id: string; quantity: number; reservedQuantity: number; lowStockThreshold: number; updatedAt: Date } | null }) => {
      const inventory = product.inventory;
      const availableStock = inventory ? inventory.quantity - inventory.reservedQuantity : 0;
      
      let stockStatus = 'available';
      if (availableStock <= 0) {
        stockStatus = 'out';
      } else if (inventory && availableStock <= inventory.lowStockThreshold) {
        stockStatus = 'low';
      }

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        inventory: inventory ? {
          id: inventory.id,
          quantity: inventory.quantity,
          reservedQuantity: inventory.reservedQuantity,
          availableQuantity: availableStock,
          lowStockThreshold: inventory.lowStockThreshold,
          stockStatus,
          lastUpdated: inventory.updatedAt,
        } : null,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      statistics: {
        totalProducts: inventoryStats._count.id || 0,
        totalStock: inventoryStats._sum.quantity || 0,
        totalReserved: inventoryStats._sum.reservedQuantity || 0,
        totalAvailable: (inventoryStats._sum.quantity || 0) - (inventoryStats._sum.reservedQuantity || 0),
        lowStockItems: lowStockCount,
        outOfStockItems: outOfStockCount,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/inventory - Update inventory for a product
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateInventorySchema.parse(body);
    const { productId, quantity, reservedQuantity, lowStockThreshold } = validatedData;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validate reserved quantity doesn't exceed total quantity
    const finalReservedQuantity = reservedQuantity ?? product.inventory?.reservedQuantity ?? 0;
    if (finalReservedQuantity > quantity) {
      return NextResponse.json(
        { error: 'Reserved quantity cannot exceed total quantity' },
        { status: 400 }
      );
    }

    // Update or create inventory
    const updatedInventory = await prisma.inventory.upsert({
      where: { productId },
      update: {
        quantity,
        ...(reservedQuantity !== undefined && { reservedQuantity }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold }),
      },
      create: {
        productId,
        quantity,
        reservedQuantity: finalReservedQuantity,
        lowStockThreshold: lowStockThreshold ?? 10,
      },
    });

    const availableQuantity = updatedInventory.quantity - updatedInventory.reservedQuantity;
    let stockStatus = 'available';
    if (availableQuantity <= 0) {
      stockStatus = 'out';
    } else if (availableQuantity <= updatedInventory.lowStockThreshold) {
      stockStatus = 'low';
    }

    return NextResponse.json({
      message: 'Inventory updated successfully',
      inventory: {
        ...updatedInventory,
        availableQuantity,
        stockStatus,
      },
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

// POST /api/admin/inventory - Bulk update inventory
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = bulkUpdateSchema.parse(body);
    const { updates } = validatedData;

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    if (updates.length > 100) {
      return NextResponse.json(
        { error: 'Too many updates. Maximum 100 allowed per request' },
        { status: 400 }
      );
    }

    // Validate all products exist
    const productIds = updates.map(update => update.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: { inventory: true },
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map((p: { id: string }) => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { error: `Products not found: ${missingIds.join(', ')}` },
        { status: 404 }
      );
    }

    // Validate reserved quantities
    for (const update of updates) {
      const product = products.find((p: { id: string; name?: string; inventory?: { reservedQuantity?: number } | null }) => p.id === update.productId);
      const finalReservedQuantity = update.reservedQuantity ?? product?.inventory?.reservedQuantity ?? 0;
      
      if (finalReservedQuantity > update.quantity) {
        return NextResponse.json(
          {
            error: `Reserved quantity cannot exceed total quantity for product ${product?.name || update.productId}`,
          },
          { status: 400 }
        );
      }
    }

    // Perform bulk update in transaction
    const results = await prisma.$transaction(
      updates.map(update => {
        const product = products.find((p: { id: string; inventory?: { reservedQuantity?: number } | null }) => p.id === update.productId);
        const finalReservedQuantity = update.reservedQuantity ?? product?.inventory?.reservedQuantity ?? 0;
        
        return prisma.inventory.upsert({
          where: { productId: update.productId },
          update: {
            quantity: update.quantity,
            ...(update.reservedQuantity !== undefined && { reservedQuantity: update.reservedQuantity }),
            ...(update.lowStockThreshold !== undefined && { lowStockThreshold: update.lowStockThreshold }),
          },
          create: {
            productId: update.productId,
            quantity: update.quantity,
            reservedQuantity: finalReservedQuantity,
            lowStockThreshold: update.lowStockThreshold ?? 10,
          },
        });
      })
    );

    return NextResponse.json({
      message: `Successfully updated inventory for ${results.length} products`,
      updatedCount: results.length,
    });
  } catch (error) {
    console.error('Error bulk updating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update inventory' },
      { status: 500 }
    );
  }
}