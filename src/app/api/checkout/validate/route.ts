import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';

const validateCartSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive()
  }))
});

// POST /api/checkout/validate - Validate cart against products
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = validateCartSchema.parse(body);
    const { items } = validatedData;

    const validationResults = [];
    let isValid = true;

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: {
          id: item.productId,
          isActive: true,
        },
        include: {
          inventory: true,
        },
      });

      if (!product) {
        validationResults.push({
          productId: item.productId,
          isValid: false,
          error: 'Product not found or not available',
        });
        isValid = false;
        continue;
      }

      const availableStock = 
        (product.inventory?.stockQuantity || 0) - 
        (product.inventory?.reservedQuantity || 0);

      if (availableStock < item.quantity) {
        validationResults.push({
          productId: item.productId,
          isValid: false,
          error: 'Insufficient stock',
          availableStock,
          requestedQuantity: item.quantity,
        });
        isValid = false;
      } else {
        validationResults.push({
          productId: item.productId,
          isValid: true,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            mrp: product.mrp,
          },
          availableStock,
        });
      }
    }

    return NextResponse.json({
      isValid,
      items: validationResults,
    });
  } catch (error) {
    console.error('Error validating cart:', error);
    return NextResponse.json(
      { error: 'Failed to validate cart' },
      { status: 500 }
    );
  }
}