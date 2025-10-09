// Shared in-memory storage for cart and orders
// Note: In a real application, this should be replaced with a proper database

export interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  mrp?: number;
  imageUrl: string;
  sku?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  shippingAddressId: string;
  shippingAddress: any;
  emiPlanId?: string;
  items: any[];
  tracking: any[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  emailVerified: boolean;
}

// Shared storage objects
export const inMemoryCart: { [userId: string]: CartItem[] } = {};
export const inMemoryOrders: { [userId: string]: Order[] } = {};
export const inMemoryWishlist: { [userId: string]: Array<{ productId: string; createdAt: Date; updatedAt: Date }> } = {};

// In-memory users storage with pre-seeded admin users
export const inMemoryUsers: User[] = [
  {
    userId: 'admin_001',
    name: 'System Administrator',
    email: 'admin@air5star.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', // Admin@123!
    phone: '+91-9876543210',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    emailVerified: true,
  },
  {
    userId: 'admin_002',
    name: 'Technical Admin',
    email: 'tech@air5star.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', // Admin@123!
    phone: '+91-9876543211',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    emailVerified: true,
  }
];