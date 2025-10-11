import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { calculateEMI } from '@/lib/auth-utils';

// POST /api/emi/calculate - Calculate EMI for given amount and plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestSchema = z.object({
      amount: z.number().positive('Amount must be positive'),
      emiPlanId: z.string().optional(),
      tenure: z.number().int().positive('Tenure must be positive').optional(),
      interestRate: z.number().min(0, 'Interest rate must be non-negative').optional(),
    });
    const { amount, emiPlanId, tenure, interestRate } = requestSchema.parse(body);

    let emiPlan = null;
    let finalTenure: number = tenure ?? 0;
    let finalInterestRate: number = interestRate ?? 0;

    // If EMI plan ID is provided, fetch the plan details
    if (emiPlanId) {
      emiPlan = await prisma.emiPlan.findUnique({
        where: {
          id: emiPlanId,
          isActive: true,
        },
      });

      if (!emiPlan) {
        return NextResponse.json(
          { error: 'EMI plan not found or not active' },
          { status: 404 }
        );
      }

      // Check if amount meets minimum requirement
      if (amount < emiPlan.minAmount) {
        return NextResponse.json(
          {
            error: `Minimum amount for this EMI plan is ₹${emiPlan.minAmount}`,
            minAmount: emiPlan.minAmount,
            providedAmount: amount,
          },
          { status: 400 }
        );
      }

      finalTenure = emiPlan.tenure;
      finalInterestRate = emiPlan.interestRate;
    }

    // Validate tenure and interest rate if not using EMI plan
    if (!emiPlanId) {
      if (tenure === undefined || interestRate === undefined) {
        return NextResponse.json(
          { error: 'Tenure and interest rate are required when not using an EMI plan' },
          { status: 400 }
        );
      }

      if (tenure < 1 || tenure > 60) {
        return NextResponse.json(
          { error: 'Tenure must be between 1 and 60 months' },
          { status: 400 }
        );
      }

      if (interestRate < 0 || interestRate > 50) {
        return NextResponse.json(
          { error: 'Interest rate must be between 0% and 50%' },
          { status: 400 }
        );
      }
    }

    // Calculate EMI
    const monthlyEmi = calculateEMI(amount, finalInterestRate, finalTenure);
    const totalAmount = monthlyEmi * finalTenure;
    const totalInterest = totalAmount - amount;

    // Create detailed breakdown
    const breakdown = [];
    let remainingPrincipal = amount;
    
    for (let month = 1; month <= finalTenure; month++) {
      const interestComponent = Math.round((remainingPrincipal * finalInterestRate) / 100 / 12);
      const principalComponent = monthlyEmi - interestComponent;
      remainingPrincipal -= principalComponent;

      breakdown.push({
        month,
        emi: monthlyEmi,
        principal: principalComponent,
        interest: interestComponent,
        remainingPrincipal: Math.max(0, remainingPrincipal),
      });
    }

    const response = {
      calculation: {
        principalAmount: amount,
        monthlyEmi,
        totalAmount,
        totalInterest,
        tenure: finalTenure,
        interestRate: finalInterestRate,
        processingFee: Math.round(amount * 0.02), // 2% processing fee
      },
      emiPlan: emiPlan ? {
        id: emiPlan.id,
        name: emiPlan.name,
        description: emiPlan.description,
        tenure: emiPlan.tenure,
        interestRate: emiPlan.interestRate,
        minAmount: emiPlan.minAmount,
      } : null,
      breakdown: breakdown.slice(0, 12), // Show first 12 months
      summary: {
        totalMonths: finalTenure,
        totalPayable: totalAmount,
        totalInterest: totalInterest,
        monthlySavings: Math.round((amount - monthlyEmi) / finalTenure),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error calculating EMI:', error);
    return NextResponse.json(
      { error: 'Failed to calculate EMI' },
      { status: 500 }
    );
  }
}

// GET /api/emi/calculate - Get EMI calculation for query parameters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get('amount') || '0');
    const tenure = parseInt(searchParams.get('tenure') || '0');
    const interestRate = parseFloat(searchParams.get('interestRate') || '0');
    const emiPlanId = searchParams.get('emiPlanId');

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Use POST logic for calculation
    const calculationData = {
      amount,
      ...(emiPlanId ? { emiPlanId } : { tenure, interestRate }),
    };

    // Create a mock request for POST handler
    const mockRequest = {
      json: async () => calculationData,
    } as NextRequest;

    return await POST(mockRequest);
  } catch (error) {
    console.error('Error in GET EMI calculation:', error);
    return NextResponse.json(
      { error: 'Failed to calculate EMI' },
      { status: 500 }
    );
  }
}