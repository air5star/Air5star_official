import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-utils';

// GET /api/admin/analytics - Get comprehensive analytics data
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
    const period = searchParams.get('period') || '30'; // days
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      const days = parseInt(period);
      dateFilter = {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      };
    }

    // Get comprehensive analytics data
    const [salesData, orderStats, productStats, userStats, revenueData] = await Promise.all([
      // Daily sales data for charts
      getSalesData(dateFilter),
      // Order statistics
      getOrderStatistics(dateFilter),
      // Product performance
      getProductStatistics(dateFilter),
      // User analytics
      getUserStatistics(dateFilter),
      // Revenue breakdown
      getRevenueAnalytics(dateFilter),
    ]);

    // Get category performance
    const categoryPerformance = await getCategoryPerformance(dateFilter);

    // Get payment method distribution
    const paymentMethodStats = await getPaymentMethodStats(dateFilter);

    // Get EMI usage statistics
    const emiStats = await getEMIStatistics(dateFilter);

    // Get geographical distribution (based on shipping addresses)
    const geographicalData = await getGeographicalDistribution(dateFilter);

    // Get customer lifetime value data
    const customerLTV = await getCustomerLTVData();

    // Get inventory turnover
    const inventoryTurnover = await getInventoryTurnover(dateFilter);

    return NextResponse.json({
      period: {
        days: parseInt(period),
        startDate: dateFilter.gte,
        endDate: dateFilter.lte || new Date(),
      },
      sales: salesData,
      orders: orderStats,
      products: productStats,
      users: userStats,
      revenue: revenueData,
      categories: categoryPerformance,
      payments: paymentMethodStats,
      emi: emiStats,
      geography: geographicalData,
      customerLTV,
      inventory: inventoryTurnover,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// Helper functions for analytics
async function getSalesData(dateFilter: any) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: dateFilter,
      status: {
        in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
      },
    },
    select: {
      totalAmount: true,
      createdAt: true,
      status: true,
    },
  });

  // Group by date
  const dailySales: Record<string, { date: string; revenue: number; orders: number }> = {};
  
  orders.forEach(order => {
    const date = order.createdAt.toISOString().split('T')[0];
    if (!dailySales[date]) {
      dailySales[date] = { date, revenue: 0, orders: 0 };
    }
    dailySales[date].revenue += order.totalAmount;
    dailySales[date].orders += 1;
  });

  return Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date));
}

async function getOrderStatistics(dateFilter: any) {
  const [totalOrders, ordersByStatus, avgOrderValue, completionRate] = await Promise.all([
    prisma.order.count({
      where: { createdAt: dateFilter },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: dateFilter },
      _count: { id: true },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: dateFilter,
        status: {
          in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
        },
      },
      _avg: { totalAmount: true },
    }),
    getOrderCompletionRate(dateFilter),
  ]);

  return {
    total: totalOrders,
    byStatus: ordersByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>),
    averageValue: avgOrderValue._avg.totalAmount || 0,
    completionRate,
  };
}

async function getProductStatistics(dateFilter: any) {
  const [topSellingProducts, lowStockProducts, totalProducts] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: dateFilter,
          status: {
            in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
          },
        },
      },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    }),
    prisma.inventory.findMany({
      where: {
        OR: [
          { quantity: { lte: prisma.inventory.fields.lowStockThreshold } },
          { quantity: 0 },
        ],
        product: { isActive: true },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      take: 20,
    }),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  // Get product details for top selling
  const productIds = topSellingProducts.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true, price: true, image: true },
  });

  const topSellingWithDetails = topSellingProducts.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      product,
      quantitySold: item._sum.quantity || 0,
      orderCount: item._count.id,
      revenue: (product?.price || 0) * (item._sum.quantity || 0),
    };
  });

  return {
    total: totalProducts,
    topSelling: topSellingWithDetails,
    lowStock: lowStockProducts.map(item => ({
      product: item.product,
      currentStock: item.quantity,
      reservedStock: item.reservedQuantity,
      availableStock: item.quantity - item.reservedQuantity,
      threshold: item.lowStockThreshold,
    })),
  };
}

async function getUserStatistics(dateFilter: any) {
  const [totalUsers, newUsers, activeUsers, topCustomers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: dateFilter },
    }),
    prisma.user.count({
      where: {
        orders: {
          some: {
            createdAt: dateFilter,
          },
        },
      },
    }),
    prisma.user.findMany({
      include: {
        _count: {
          select: {
            orders: {
              where: {
                status: {
                  in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
                },
              },
            },
          },
        },
        orders: {
          where: {
            status: {
              in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
            },
          },
          select: {
            totalAmount: true,
          },
        },
      },
      take: 10,
    }),
  ]);

  // Calculate top customers by total spent
  const customersWithSpending = topCustomers
    .map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      orderCount: user._count.orders,
      totalSpent: user.orders.reduce((sum, order) => sum + order.totalAmount, 0),
    }))
    .filter(customer => customer.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  return {
    total: totalUsers,
    new: newUsers,
    active: activeUsers,
    topCustomers: customersWithSpending,
  };
}

async function getRevenueAnalytics(dateFilter: any) {
  const [totalRevenue, revenueByPaymentMethod, revenueGrowth] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: dateFilter,
        status: {
          in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
        },
      },
      _sum: { totalAmount: true },
    }),
    prisma.payment.groupBy({
      by: ['method'],
      where: {
        order: {
          createdAt: dateFilter,
          status: {
            in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
          },
        },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    getRevenueGrowth(dateFilter),
  ]);

  return {
    total: totalRevenue._sum.totalAmount || 0,
    byPaymentMethod: revenueByPaymentMethod.reduce((acc, item) => {
      acc[item.method] = {
        revenue: item._sum.amount || 0,
        count: item._count.id,
      };
      return acc;
    }, {} as Record<string, { revenue: number; count: number }>),
    growth: revenueGrowth,
  };
}

async function getCategoryPerformance(dateFilter: any) {
  const categoryStats = await prisma.category.findMany({
    include: {
      products: {
        include: {
          orderItems: {
            where: {
              order: {
                createdAt: dateFilter,
                status: {
                  in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
                },
              },
            },
          },
        },
      },
    },
  });

  return categoryStats.map(category => {
    const totalQuantity = category.products.reduce(
      (sum, product) => sum + product.orderItems.reduce((pSum, item) => pSum + item.quantity, 0),
      0
    );
    const totalRevenue = category.products.reduce(
      (sum, product) => sum + product.orderItems.reduce((pSum, item) => pSum + item.price * item.quantity, 0),
      0
    );
    const productCount = category.products.length;

    return {
      id: category.id,
      name: category.name,
      productCount,
      totalQuantitySold: totalQuantity,
      totalRevenue,
      averageRevenuePerProduct: productCount > 0 ? totalRevenue / productCount : 0,
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

async function getPaymentMethodStats(dateFilter: any) {
  return prisma.payment.groupBy({
    by: ['method', 'status'],
    where: {
      order: {
        createdAt: dateFilter,
      },
    },
    _count: { id: true },
    _sum: { amount: true },
  });
}

async function getEMIStatistics(dateFilter: any) {
  const [emiOrders, emiPlans] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: dateFilter,
        emiPlanId: { not: null },
      },
      include: {
        emiPlan: true,
      },
    }),
    prisma.emiPlan.findMany({
      include: {
        _count: {
          select: {
            orders: {
              where: {
                createdAt: dateFilter,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalEMIRevenue = emiOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const avgEMIOrderValue = emiOrders.length > 0 ? totalEMIRevenue / emiOrders.length : 0;

  return {
    totalEMIOrders: emiOrders.length,
    totalEMIRevenue,
    averageEMIOrderValue: avgEMIOrderValue,
    planUsage: emiPlans.map(plan => ({
      id: plan.id,
      name: plan.name,
      tenure: plan.tenure,
      interestRate: plan.interestRate,
      orderCount: plan._count.orders,
    })),
  };
}

async function getGeographicalDistribution(dateFilter: any) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: dateFilter,
    },
    include: {
      shippingAddress: true,
    },
  });

  const stateDistribution: Record<string, { orders: number; revenue: number }> = {};
  const cityDistribution: Record<string, { orders: number; revenue: number }> = {};

  orders.forEach(order => {
    const state = order.shippingAddress?.state || 'Unknown';
    const city = order.shippingAddress?.city || 'Unknown';

    if (!stateDistribution[state]) {
      stateDistribution[state] = { orders: 0, revenue: 0 };
    }
    if (!cityDistribution[city]) {
      cityDistribution[city] = { orders: 0, revenue: 0 };
    }

    stateDistribution[state].orders += 1;
    stateDistribution[state].revenue += order.totalAmount;
    cityDistribution[city].orders += 1;
    cityDistribution[city].revenue += order.totalAmount;
  });

  return {
    byState: Object.entries(stateDistribution)
      .map(([state, data]) => ({ state, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
    byCity: Object.entries(cityDistribution)
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20), // Top 20 cities
  };
}

async function getCustomerLTVData() {
  const users = await prisma.user.findMany({
    include: {
      orders: {
        where: {
          status: {
            in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
          },
        },
        select: {
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });

  const ltvData = users
    .map(user => {
      const totalSpent = user.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const orderCount = user.orders.length;
      const firstOrderDate = user.orders.length > 0 
        ? Math.min(...user.orders.map(o => o.createdAt.getTime()))
        : null;
      const daysSinceFirstOrder = firstOrderDate 
        ? Math.floor((Date.now() - firstOrderDate) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        userId: user.id,
        totalSpent,
        orderCount,
        averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
        daysSinceFirstOrder,
        estimatedLTV: orderCount > 0 && daysSinceFirstOrder > 0 
          ? (totalSpent / daysSinceFirstOrder) * 365 // Annualized
          : totalSpent,
      };
    })
    .filter(data => data.totalSpent > 0)
    .sort((a, b) => b.estimatedLTV - a.estimatedLTV);

  const avgLTV = ltvData.length > 0 
    ? ltvData.reduce((sum, data) => sum + data.estimatedLTV, 0) / ltvData.length
    : 0;

  return {
    averageLTV: avgLTV,
    topCustomers: ltvData.slice(0, 10),
    totalCustomersWithOrders: ltvData.length,
  };
}

async function getInventoryTurnover(dateFilter: any) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      inventory: true,
      orderItems: {
        where: {
          order: {
            createdAt: dateFilter,
            status: {
              in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
            },
          },
        },
      },
    },
  });

  const turnoverData = products.map(product => {
    const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const currentStock = product.inventory?.quantity || 0;
    const turnoverRate = currentStock > 0 ? totalSold / currentStock : 0;

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      currentStock,
      totalSold,
      turnoverRate,
      daysOfStock: turnoverRate > 0 ? Math.floor(currentStock / (totalSold / 30)) : Infinity,
    };
  });

  return {
    products: turnoverData.sort((a, b) => b.turnoverRate - a.turnoverRate),
    averageTurnoverRate: turnoverData.length > 0 
      ? turnoverData.reduce((sum, data) => sum + data.turnoverRate, 0) / turnoverData.length
      : 0,
  };
}

async function getOrderCompletionRate(dateFilter: any) {
  const [totalOrders, completedOrders] = await Promise.all([
    prisma.order.count({
      where: { createdAt: dateFilter },
    }),
    prisma.order.count({
      where: {
        createdAt: dateFilter,
        status: 'DELIVERED',
      },
    }),
  ]);

  return totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
}

async function getRevenueGrowth(dateFilter: any) {
  // Calculate previous period for comparison
  const periodStart = dateFilter.gte;
  const periodEnd = dateFilter.lte || new Date();
  const periodDuration = periodEnd.getTime() - periodStart.getTime();
  const previousPeriodStart = new Date(periodStart.getTime() - periodDuration);
  const previousPeriodEnd = periodStart;

  const [currentRevenue, previousRevenue] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: dateFilter,
        status: {
          in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
        },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: previousPeriodEnd,
        },
        status: {
          in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'],
        },
      },
      _sum: { totalAmount: true },
    }),
  ]);

  const current = currentRevenue._sum.totalAmount || 0;
  const previous = previousRevenue._sum.totalAmount || 0;
  const growthRate = previous > 0 ? ((current - previous) / previous) * 100 : 0;

  return {
    current,
    previous,
    growthRate,
    growthAmount: current - previous,
  };
}