import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emiPlanSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth-utils';

// GET /api/emi/plans - Get available EMI plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get('amount') || '0');

    // Get all active EMI plans
    const emiPlans = await prisma.emiPlan.findMany({
      where: {
        isActive: true,
        minAmount: {
          lte: amount || undefined,
        },
      },
      orderBy: {
        tenure: 'asc',
      },
    });

    // Calculate EMI amounts for each plan if amount is provided
    const plansWithCalculations = emiPlans.map((plan) => {
      let monthlyEmi = 0;
      let totalAmount = 0;
      let totalInterest = 0;

      if (amount > 0) {
        const principal = amount;
        const monthlyRate = plan.interestRate / 100 / 12;
        const tenure = plan.tenure;

        if (plan.interestRate > 0) {
          // Calculate EMI using formula: P * r * (1+r)^n / ((1+r)^n - 1)
          monthlyEmi = Math.round(
            (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
            (Math.pow(1 + monthlyRate, tenure) - 1)
          );
        } else {
          // No interest case
          monthlyEmi = Math.round(principal / tenure);
        }

        totalAmount = monthlyEmi * tenure;
        totalInterest = totalAmount - principal;
      }

      return {
        ...plan,
        calculations: amount > 0 ? {
          monthlyEmi,
          totalAmount,
          totalInterest,
          principalAmount: amount,
        } : null,
      };
    });

    return NextResponse.json({
      plans: plansWithCalculations,
      eligiblePlans: plansWithCalculations.filter(plan => 
        !amount || amount >= plan.minAmount
      ),
    });
  } catch (error) {
    console.error('Error fetching EMI plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch EMI plans' },
      { status: 500 }
    );
  }
}

// POST /api/emi/plans - Create a new EMI plan (Admin only)
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
    const validatedData = emiPlanSchema.parse(body);

    // Check if EMI plan with same tenure already exists
    const existingPlan = await prisma.emiPlan.findUnique({
      where: { tenure: validatedData.tenure },
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: 'EMI plan with this tenure already exists' },
        { status: 400 }
      );
    }

    // Create EMI plan
    const emiPlan = await prisma.emiPlan.create({
      data: validatedData,
    });

    return NextResponse.json(
      {
        message: 'EMI plan created successfully',
        emiPlan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating EMI plan:', error);
    return NextResponse.json(
      { error: 'Failed to create EMI plan' },
      { status: 500 }
    );
  }
}