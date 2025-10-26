import { z } from 'zod';

// Helper to build combined password error messages
function buildPasswordMessage(missing: string[]): string {
  const parts = missing.map((m) => {
    switch (m) {
      case 'uppercase':
        return 'at least one uppercase letter';
      case 'lowercase':
        return 'at least one lowercase letter';
      case 'number':
        return 'at least one number';
      case 'special':
        return 'at least one special character';
      default:
        return m;
    }
  });
  if (parts.length === 1) {
    return `Password must contain ${parts[0]}.`;
  }
  if (parts.length === 2) {
    return `Password must contain ${parts[0]} and ${parts[1]}.`;
  }
  return `Password must contain ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}.`;
}

// User validation schemas
export const signupSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .refine((email) => {
      // Additional email validation
      const domain = email.split('@')[1];
      return domain && domain.includes('.') && domain.length > 3;
    }, 'Invalid email domain'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .superRefine((val, ctx) => {
      const missing: string[] = [];
      if (!/[A-Z]/.test(val)) missing.push('uppercase');
      if (!/[a-z]/.test(val)) missing.push('lowercase');
      if (!/\d/.test(val)) missing.push('number');
      if (!/[@$!%*?&]/.test(val)) missing.push('special');
      if (missing.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: buildPasswordMessage(missing),
          path: ['password']
        });
      }
    }),
  phone: z.string()
    .optional()
    .refine((phone) => {
      if (!phone) return true;
      const cleanPhone = phone.replace(/\D/g, '');
      // Accept phone numbers with 10-15 digits (international format support)
      // For Indian numbers, allow 6-9 as first digit, but also accept international formats
      return cleanPhone.length >= 10 && cleanPhone.length <= 15 && /^\d+$/.test(cleanPhone);
    }, 'Phone number must be 10-15 digits'),
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
});

// Frontend login schema for forms that accept email or mobile
export const frontendLoginSchema = z.object({
  emailOrMobile: z.string().min(1, 'Email or mobile number is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Frontend signup schema for forms
export const frontendSignupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .superRefine((val, ctx) => {
      const missing: string[] = [];
      if (!/[A-Z]/.test(val)) missing.push('uppercase');
      if (!/[a-z]/.test(val)) missing.push('lowercase');
      if (!/\d/.test(val)) missing.push('number');
      if (!/[@$!%*?&]/.test(val)) missing.push('special');
      if (missing.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: buildPasswordMessage(missing),
          path: ['password']
        });
      }
    }),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  image: z.string().url().optional(),
});

// Address validation schema
export const addressSchema = z.object({
  type: z.enum(['HOME', 'OFFICE', 'OTHER']).optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  addressLine: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(6, 'Postal code must be at least 6 characters'),
  country: z.string().default('India'),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
});

// Frontend address validation schema (for user profile form)
export const frontendAddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  mobile: z.string().min(10, 'Valid mobile number is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(6, 'Valid PIN code is required'),
  landmark: z.string().optional(),
  addressType: z.enum(['HOME', 'OFFICE', 'OTHER']),
  isDefault: z.boolean().default(false)
});

// Product validation schemas
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  mrp: z.number().positive().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  brand: z.string().optional(),
  imageUrl: z.string().url().optional(),
  specifications: z.record(z.any()).optional(),
  thumbnailImages: z.record(z.string().url()).optional(),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
});

export const updateProductSchema = productSchema.partial();

// Category validation schema
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

// Cart validation schemas
export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  category: z.union([
    z.string(),
    z.object({
      name: z.string(),
      slug: z.string()
    })
  ]).optional(),
});

export const updateCartSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
});

// Wishlist validation schemas
export const addToWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

export const removeFromWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

// Order validation schemas
export const createOrderSchema = z.object({
  shippingAddressId: z.string().min(1, 'Shipping address is required'),
  paymentMethod: z.enum(['RAZORPAY', 'STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'EMI']),
  notes: z.string().optional(),
  isEmi: z.boolean().default(false),
  emiPlanId: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
    'REFUNDED',
  ]),
  message: z.string().optional(),
});

// Payment validation schemas
export const createPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('INR'),
  paymentMethod: z.enum(['RAZORPAY', 'STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'EMI']),
  isEmi: z.boolean().default(false),
  emiPlan: z.object({
    months: z.number().int().positive(),
    interestRate: z.number().min(0),
    monthlyAmount: z.number().positive(),
  }).optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
});

// Review validation schema
export const reviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().optional(),
});

// EMI Plan validation schema
export const emiPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  months: z.number().int().positive('Months must be positive'),
  interestRate: z.number().min(0, 'Interest rate must be non-negative'),
  minAmount: z.number().positive('Minimum amount must be positive'),
  maxAmount: z.number().positive().optional(),
  isActive: z.boolean().default(true),
});

// Search and filter schemas
export const productSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'created_desc']).default('created_desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// EMI Calculator schema
export const emiCalculatorSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  months: z.number().int().positive('Months must be positive'),
  interestRate: z.number().min(0, 'Interest rate must be non-negative'),
});

export const emiCalculationSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  months: z.number().int().positive('Months must be positive'),
  interestRate: z.number().min(0, 'Interest rate must be non-negative'),
});

// Coupon validation schemas
export const couponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  name: z.string().min(1, 'Coupon name is required'),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
  value: z.number().positive('Coupon value must be positive'),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  usageCount: z.number().int().min(0).default(0),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  isActive: z.boolean().default(true),
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  orderAmount: z.number().positive('Order amount must be positive'),
});

export const removeCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
});

export const processPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentMethod: z.enum([
    'RAZORPAY',
    'UPI',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'NET_BANKING',
    'WALLET',
    'EMI'
  ]),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('INR'),
  paymentDetails: z.object({
    upiId: z.string().optional(),
    cardToken: z.string().optional(),
    bankCode: z.string().optional(),
    walletProvider: z.enum(['PHONEPE', 'GOOGLEPAY', 'PAYTM', 'AMAZONPAY']).optional(),
  }).optional(),
  isEmi: z.boolean().default(false),
  emiPlanId: z.string().optional(),
  savePaymentMethod: z.boolean().default(false),
});

export const checkoutCalculateSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })),
  shippingAddressId: z.string().optional(),
  couponCode: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartInput = z.infer<typeof updateCartSchema>;
export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;
export type RemoveFromWishlistInput = z.infer<typeof removeFromWishlistSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type EmiPlanInput = z.infer<typeof emiPlanSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type EmiCalculatorInput = z.infer<typeof emiCalculatorSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type RemoveCouponInput = z.infer<typeof removeCouponSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type CheckoutCalculateInput = z.infer<typeof checkoutCalculateSchema>;