import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, validateAdminRole } from '@/lib/auth-utils';

// GET /api/admin/dashboard - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await getUserFromRequest(request);
    if (!user || !(await validateAdminRole(user.userId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current date for time-based queries
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch dashboard statistics
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      usersThisMonth,
      ordersThisMonth,
      revenueThisMonth,
      ordersToday,
      pendingOrders,
      lowStockProducts,
      recentOrders,
      recentUsers,
      recentProducts
    ] = await Promise.all([
      // Total counts
      prisma.user.count({
        where: { role: 'USER', isActive: true }
      }),
      prisma.product.count({
        where: { isActive: true }
      }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: 'CANCELLED' } }
      }),

      // Monthly growth data
      prisma.user.count({
        where: {
          role: 'USER',
          isActive: true,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.order.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { not: 'CANCELLED' }
        }
      }),

      // Today's orders
      prisma.order.count({
        where: { createdAt: { gte: today } }
      }),

      // Pending orders
      prisma.order.count({
        where: { status: 'PENDING' }
      }),

      // Low stock products (assuming stock < 10 is low)
      prisma.inventory.count({
        where: { quantity: { lt: 10 } }
      }),

      // Recent orders (last 10)
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),

      // Recent users (last 5)
      prisma.user.findMany({
        take: 5,
        where: { role: 'USER' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          isActive: true
        }
      }),

      // Recent products (last 5)
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          price: true,
          createdAt: true,
          isActive: true,
          category: {
            select: { name: true }
          }
        }
      })
    ]);

    // Calculate growth percentages (simplified calculation)
    const userGrowth = totalUsers > 0 ? ((usersThisMonth / totalUsers) * 100) : 0;
    const orderGrowth = totalOrders > 0 ? ((ordersThisMonth / totalOrders) * 100) : 0;
    const revenueGrowth = totalRevenue._sum.totalAmount && totalRevenue._sum.totalAmount > 0 
      ? ((revenueThisMonth._sum.totalAmount || 0) / totalRevenue._sum.totalAmount * 100) 
      : 0;

    // Format recent orders for frontend
    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user?.name || 'Unknown',
      customerEmail: order.user?.email || '',
      amount: order.totalAmount,
      status: order.status.toLowerCase(),
      date: order.createdAt.toISOString().split('T')[0]
    }));

    const dashboardData = {
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        ordersToday,
        pendingOrders,
        lowStockProducts,
        userGrowth: Math.round(userGrowth * 100) / 100,
        orderGrowth: Math.round(orderGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100
      },
      recentOrders: formattedRecentOrders,
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        joinDate: user.createdAt.toISOString().split('T')[0],
        isActive: user.isActive
      })),
      recentProducts: recentProducts.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category?.name || 'Uncategorized',
        addedDate: product.createdAt.toISOString().split('T')[0],
        isActive: product.isActive
      }))
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}