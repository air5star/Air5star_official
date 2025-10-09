import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdminRole } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    const user = await validateAdminRole(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (role && role !== 'all') {
      where.role = role.toUpperCase();
    }

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - Update user role
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
    const dbUser = inMemoryUsers.find(u => u.userId === user.userId && u.isActive !== false);

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateUserRoleSchema.parse(body);
    const { userId, role } = validatedData;

    // Prevent admin from changing their own role
    if (userId === user.userId) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Find target user in memory
    const targetUserIndex = inMemoryUsers.findIndex(u => u.userId === userId);

    if (targetUserIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user role
    inMemoryUsers[targetUserIndex] = {
      ...inMemoryUsers[targetUserIndex],
      role,
      updatedAt: new Date().toISOString(),
    };

    const updatedUser = inMemoryUsers[targetUserIndex];
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      message: `User role updated to ${role} successfully`,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users - Delete a user (soft delete by deactivating)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = inMemoryUsers.find(u => u.userId === user.userId && u.isActive !== false);

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === user.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Find target user in memory
    const targetUserIndex = inMemoryUsers.findIndex(u => u.userId === userId);

    if (targetUserIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const targetUser = inMemoryUsers[targetUserIndex];

    // Check if user has active orders
    const userOrders = inMemoryOrders[userId] || [];
    const activeOrders = userOrders.filter(order => 
      ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status)
    );

    if (activeOrders.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete user with active orders',
          activeOrders: activeOrders.length,
        },
        { status: 400 }
      );
    }

    // Soft delete by deactivating the user
    inMemoryUsers[targetUserIndex] = {
      ...targetUser,
      isActive: false,
      email: `deleted_${Date.now()}_${targetUser.email}`,
      name: `[DELETED] ${targetUser.name}`,
      emailVerified: false,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      message: 'User account deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}