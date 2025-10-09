import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-utils';
import { inMemoryUsers } from '@/lib/storage';

export async function adminAuthMiddleware(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user exists and has admin role
    const dbUser = inMemoryUsers.find(u => u.userId === user.userId && u.isActive !== false);

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (dbUser.isActive === false) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    if (dbUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Add user info to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-admin-user-id', dbUser.userId);
    response.headers.set('x-admin-user-email', dbUser.email);
    response.headers.set('x-admin-user-name', dbUser.name);
    
    return response;
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Helper function to check admin access in API routes
export async function requireAdminAccess(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const dbUser = inMemoryUsers.find(u => u.userId === user.userId && u.isActive !== false);

  if (!dbUser || dbUser.isActive === false) {
    throw new Error('User not found or inactive');
  }

  if (dbUser.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return { userId: user.userId, ...user };
}