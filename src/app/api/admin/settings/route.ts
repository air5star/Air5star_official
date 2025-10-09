import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-utils';
import { z } from 'zod';

const settingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().default(false),
});

const bulkSettingsSchema = z.object({
  settings: z.array(settingSchema),
});

// GET /api/admin/settings - Get all system settings
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
    const category = searchParams.get('category');
    const isPublic = searchParams.get('isPublic');

    // Build where clause
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (isPublic !== null) {
      where.isPublic = isPublic === 'true';
    }

    // Get settings
    const settings = await prisma.setting.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      const category = setting.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {} as Record<string, typeof settings>);

    // Get available categories
    const categories = await prisma.setting.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { category: { not: null } },
    });

    return NextResponse.json({
      settings: groupedSettings,
      categories: categories.map(c => c.category).filter(Boolean),
      total: settings.length,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings - Create or update a setting
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
    const validatedData = settingSchema.parse(body);
    const { key, value, description, category, isPublic } = validatedData;

    // Create or update setting
    const setting = await prisma.setting.upsert({
      where: { key },
      update: {
        value,
        description,
        category,
        isPublic,
      },
      create: {
        key,
        value,
        description,
        category: category || 'general',
        isPublic,
      },
    });

    return NextResponse.json({
      message: 'Setting saved successfully',
      setting,
    });
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Bulk update settings
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
    const validatedData = bulkSettingsSchema.parse(body);
    const { settings } = validatedData;

    if (settings.length === 0) {
      return NextResponse.json(
        { error: 'No settings provided' },
        { status: 400 }
      );
    }

    if (settings.length > 50) {
      return NextResponse.json(
        { error: 'Too many settings. Maximum 50 allowed per request' },
        { status: 400 }
      );
    }

    // Bulk update settings in transaction
    const results = await prisma.$transaction(
      settings.map(setting => 
        prisma.setting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            description: setting.description,
            category: setting.category,
            isPublic: setting.isPublic,
          },
          create: {
            key: setting.key,
            value: setting.value,
            description: setting.description,
            category: setting.category || 'general',
            isPublic: setting.isPublic,
          },
        })
      )
    );

    return NextResponse.json({
      message: `Successfully updated ${results.length} settings`,
      updatedCount: results.length,
    });
  } catch (error) {
    console.error('Error bulk updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update settings' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/settings - Delete a setting
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
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      );
    }

    // Check if setting exists
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of critical system settings
    const protectedSettings = [
      'site_name',
      'site_url',
      'admin_email',
      'currency',
      'tax_rate',
      'shipping_enabled',
      'payment_gateway_enabled',
    ];

    if (protectedSettings.includes(key)) {
      return NextResponse.json(
        { error: 'Cannot delete protected system setting' },
        { status: 400 }
      );
    }

    // Delete setting
    await prisma.setting.delete({
      where: { key },
    });

    return NextResponse.json({
      message: 'Setting deleted successfully',
      key,
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}

// Initialize default settings if they don't exist
async function initializeDefaultSettings() {
  const defaultSettings = [
    // Site Configuration
    {
      key: 'site_name',
      value: 'HVAC E-Commerce',
      description: 'Name of the website',
      category: 'site',
      isPublic: true,
    },
    {
      key: 'site_description',
      value: 'Your trusted partner for HVAC equipment and solutions',
      description: 'Site description for SEO',
      category: 'site',
      isPublic: true,
    },
    {
      key: 'site_url',
      value: 'https://localhost:3000',
      description: 'Base URL of the website',
      category: 'site',
      isPublic: true,
    },
    {
      key: 'admin_email',
      value: 'admin@hvac-store.com',
      description: 'Primary admin email address',
      category: 'site',
      isPublic: false,
    },
    {
      key: 'support_email',
      value: 'support@hvac-store.com',
      description: 'Customer support email',
      category: 'site',
      isPublic: true,
    },
    {
      key: 'support_phone',
      value: '+1-800-HVAC-HELP',
      description: 'Customer support phone number',
      category: 'site',
      isPublic: true,
    },

    // Business Configuration
    {
      key: 'currency',
      value: 'INR',
      description: 'Default currency code',
      category: 'business',
      isPublic: true,
    },
    {
      key: 'currency_symbol',
      value: '₹',
      description: 'Currency symbol',
      category: 'business',
      isPublic: true,
    },
    {
      key: 'tax_rate',
      value: '18',
      description: 'Default tax rate percentage',
      category: 'business',
      isPublic: true,
    },
    {
      key: 'tax_name',
      value: 'GST',
      description: 'Name of the tax (e.g., GST, VAT)',
      category: 'business',
      isPublic: true,
    },

    // Shipping Configuration
    {
      key: 'shipping_enabled',
      value: 'true',
      description: 'Enable shipping functionality',
      category: 'shipping',
      isPublic: true,
    },
    {
      key: 'free_shipping_threshold',
      value: '5000',
      description: 'Minimum order amount for free shipping',
      category: 'shipping',
      isPublic: true,
    },
    {
      key: 'default_shipping_cost',
      value: '200',
      description: 'Default shipping cost',
      category: 'shipping',
      isPublic: true,
    },
    {
      key: 'shipping_zones',
      value: JSON.stringify([
        { name: 'Local', states: ['Delhi', 'NCR'], cost: 100 },
        { name: 'National', states: ['*'], cost: 200 },
      ]),
      description: 'Shipping zones configuration',
      category: 'shipping',
      isPublic: false,
    },

    // Payment Configuration
    {
      key: 'payment_gateway_enabled',
      value: 'true',
      description: 'Enable online payment gateway',
      category: 'payment',
      isPublic: true,
    },
    {
      key: 'cod_enabled',
      value: 'true',
      description: 'Enable Cash on Delivery',
      category: 'payment',
      isPublic: true,
    },
    {
      key: 'cod_charges',
      value: '50',
      description: 'Cash on Delivery charges',
      category: 'payment',
      isPublic: true,
    },
    {
      key: 'razorpay_key_id',
      value: '',
      description: 'Razorpay Key ID',
      category: 'payment',
      isPublic: false,
    },
    {
      key: 'razorpay_key_secret',
      value: '',
      description: 'Razorpay Key Secret',
      category: 'payment',
      isPublic: false,
    },

    // EMI Configuration
    {
      key: 'emi_enabled',
      value: 'true',
      description: 'Enable EMI functionality',
      category: 'emi',
      isPublic: true,
    },
    {
      key: 'emi_minimum_amount',
      value: '10000',
      description: 'Minimum order amount for EMI',
      category: 'emi',
      isPublic: true,
    },

    // Inventory Configuration
    {
      key: 'low_stock_threshold',
      value: '10',
      description: 'Default low stock threshold',
      category: 'inventory',
      isPublic: false,
    },
    {
      key: 'auto_reserve_inventory',
      value: 'true',
      description: 'Automatically reserve inventory on order confirmation',
      category: 'inventory',
      isPublic: false,
    },

    // Email Configuration
    {
      key: 'smtp_host',
      value: '',
      description: 'SMTP server host',
      category: 'email',
      isPublic: false,
    },
    {
      key: 'smtp_port',
      value: '587',
      description: 'SMTP server port',
      category: 'email',
      isPublic: false,
    },
    {
      key: 'smtp_username',
      value: '',
      description: 'SMTP username',
      category: 'email',
      isPublic: false,
    },
    {
      key: 'smtp_password',
      value: '',
      description: 'SMTP password',
      category: 'email',
      isPublic: false,
    },
    {
      key: 'email_from_address',
      value: 'noreply@hvac-store.com',
      description: 'Default from email address',
      category: 'email',
      isPublic: false,
    },
    {
      key: 'email_from_name',
      value: 'HVAC Store',
      description: 'Default from name for emails',
      category: 'email',
      isPublic: false,
    },

    // Security Configuration
    {
      key: 'jwt_expiry',
      value: '7d',
      description: 'JWT token expiry duration',
      category: 'security',
      isPublic: false,
    },
    {
      key: 'max_login_attempts',
      value: '5',
      description: 'Maximum login attempts before lockout',
      category: 'security',
      isPublic: false,
    },
    {
      key: 'session_timeout',
      value: '30',
      description: 'Session timeout in minutes',
      category: 'security',
      isPublic: false,
    },

    // Feature Flags
    {
      key: 'reviews_enabled',
      value: 'true',
      description: 'Enable product reviews',
      category: 'features',
      isPublic: true,
    },
    {
      key: 'wishlist_enabled',
      value: 'true',
      description: 'Enable wishlist functionality',
      category: 'features',
      isPublic: true,
    },
    {
      key: 'guest_checkout_enabled',
      value: 'false',
      description: 'Allow guest checkout',
      category: 'features',
      isPublic: true,
    },
    {
      key: 'product_comparison_enabled',
      value: 'true',
      description: 'Enable product comparison',
      category: 'features',
      isPublic: true,
    },

    // SEO Configuration
    {
      key: 'meta_title',
      value: 'HVAC Equipment & Solutions | Best Prices Online',
      description: 'Default meta title',
      category: 'seo',
      isPublic: true,
    },
    {
      key: 'meta_description',
      value: 'Shop premium HVAC equipment, air conditioners, ventilation systems and more. Best prices, expert support, fast delivery.',
      description: 'Default meta description',
      category: 'seo',
      isPublic: true,
    },
    {
      key: 'meta_keywords',
      value: 'HVAC, air conditioning, ventilation, heating, cooling, equipment',
      description: 'Default meta keywords',
      category: 'seo',
      isPublic: true,
    },
  ];

  try {
    for (const setting of defaultSettings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: {}, // Don't update existing settings
        create: setting,
      });
    }
    console.log('Default settings initialized successfully');
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
}