import { NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password with bcrypt
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export async function generateToken(userId: string, role: string, email?: string): Promise<string> {
  const payload: JWTPayload = {
    userId,
    email: email || '',
    role,
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // 8 hours for admin tokens
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Get user from request (from JWT token)
export async function getUserFromRequest(request: NextRequest): Promise<JWTPayload | null> {
  try {
    let token: string | undefined;

    // Prefer Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }

    // Fallback to cookies commonly used for auth
    if (!token) {
      token =
        request.cookies.get('auth-token')?.value ||
        request.cookies.get('token')?.value ||
        request.cookies.get('admin-token')?.value;
    }

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    return payload;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

// Create admin user in database
export async function createAdminUser(email: string, password: string, name: string) {
  try {
    const hashedPassword = await hashPassword(password);
    
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        isActive: true,
      },
    });

    return admin;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

// Authenticate admin user
export async function authenticateAdmin(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase(),
        role: 'ADMIN',
        isActive: true,
      },
    });

    if (!user || !user.password) {
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return null;
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    console.error('Error authenticating admin:', error);
    return null;
  }
}

// Validate admin role
export async function validateAdminRole(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        role: 'ADMIN',
        isActive: true,
      },
    });

    return !!user;
  } catch (error) {
    console.error('Error validating admin role:', error);
    return false;
  }
}

// Log admin activity
export async function logAdminActivity(
  adminId: string,
  action: string,
  details?: any,
  ipAddress?: string
) {
  try {
    // For now, just console log - can be extended to database logging
    console.log(`[ADMIN ACTIVITY] ${new Date().toISOString()} - Admin ${adminId} performed: ${action}`, {
      details,
      ipAddress,
    });
    
    // TODO: Implement database logging for admin activities
    // await prisma.adminLog.create({
    //   data: {
    //     adminId,
    //     action,
    //     details: details ? JSON.stringify(details) : null,
    //     ipAddress,
    //   },
    // });
  } catch (error) {
    console.error('Error logging admin activity:', error);
  }
}

// Generate order number
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// Generate SKU
export function generateSKU(category: string, brand: string): string {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const brandCode = brand.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${categoryCode}-${brandCode}-${timestamp}-${random}`;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (Indian format)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

// Calculate EMI
export function calculateEMI(
  principal: number,
  ratePerAnnum: number,
  tenureInMonths: number
): number {
  const monthlyRate = ratePerAnnum / (12 * 100);
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureInMonths)) /
    (Math.pow(1 + monthlyRate, tenureInMonths) - 1);
  return Math.round(emi * 100) / 100;
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

// Generate random string
export function generateRandomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, length + 2);
}