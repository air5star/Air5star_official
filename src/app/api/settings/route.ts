import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/settings - Get public settings for frontend
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const keys = searchParams.get('keys')?.split(',');

    // Build where clause - only public settings
    const where: any = {
      isPublic: true,
    };

    if (category) {
      where.category = category;
    }

    if (keys && keys.length > 0) {
      where.key = {
        in: keys,
      };
    }

    // Get public settings
    const settings = await prisma.setting.findMany({
      where,
      select: {
        key: true,
        value: true,
        category: true,
        description: true,
      },
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    // Convert to key-value object for easier frontend consumption
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    // Also provide grouped by category
    const groupedSettings = settings.reduce((acc, setting) => {
      const category = setting.category || 'general';
      if (!acc[category]) {
        acc[category] = {};
      }
      acc[category][setting.key] = {
        value: setting.value,
        description: setting.description,
      };
      return acc;
    }, {} as Record<string, Record<string, { value: string; description?: string }>>);

    return NextResponse.json({
      settings: settingsObject,
      grouped: groupedSettings,
      count: settings.length,
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// Helper function to get a specific setting value
export async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
      select: { value: true },
    });
    return setting?.value || null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
}

// Helper function to get multiple settings
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: keys },
      },
      select: {
        key: true,
        value: true,
      },
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error('Error fetching multiple settings:', error);
    return {};
  }
}

// Helper function to get settings by category
export async function getSettingsByCategory(category: string, includePrivate = false): Promise<Record<string, string>> {
  try {
    const where: any = { category };
    if (!includePrivate) {
      where.isPublic = true;
    }

    const settings = await prisma.setting.findMany({
      where,
      select: {
        key: true,
        value: true,
      },
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error(`Error fetching settings for category ${category}:`, error);
    return {};
  }
}

// Helper function to check if a feature is enabled
export async function isFeatureEnabled(featureKey: string): Promise<boolean> {
  try {
    const setting = await getSetting(featureKey);
    return setting === 'true';
  } catch (error) {
    console.error(`Error checking feature ${featureKey}:`, error);
    return false;
  }
}

// Helper function to get numeric setting with default
export async function getNumericSetting(key: string, defaultValue: number): Promise<number> {
  try {
    const setting = await getSetting(key);
    if (!setting) return defaultValue;
    
    const numValue = parseFloat(setting);
    return isNaN(numValue) ? defaultValue : numValue;
  } catch (error) {
    console.error(`Error getting numeric setting ${key}:`, error);
    return defaultValue;
  }
}

// Helper function to get JSON setting
export async function getJSONSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const setting = await getSetting(key);
    if (!setting) return defaultValue;
    
    return JSON.parse(setting) as T;
  } catch (error) {
    console.error(`Error parsing JSON setting ${key}:`, error);
    return defaultValue;
  }
}

// Common settings getters for frequently used values
export const SettingsHelpers = {
  // Site settings
  getSiteName: () => getSetting('site_name'),
  getSiteDescription: () => getSetting('site_description'),
  getSiteUrl: () => getSetting('site_url'),
  getSupportEmail: () => getSetting('support_email'),
  getSupportPhone: () => getSetting('support_phone'),

  // Business settings
  getCurrency: () => getSetting('currency'),
  getCurrencySymbol: () => getSetting('currency_symbol'),
  getTaxRate: () => getNumericSetting('tax_rate', 18),
  getTaxName: () => getSetting('tax_name'),

  // Shipping settings
  isShippingEnabled: () => isFeatureEnabled('shipping_enabled'),
  getFreeShippingThreshold: () => getNumericSetting('free_shipping_threshold', 5000),
  getDefaultShippingCost: () => getNumericSetting('default_shipping_cost', 200),
  getShippingZones: () => getJSONSetting('shipping_zones', []),

  // Payment settings
  isPaymentGatewayEnabled: () => isFeatureEnabled('payment_gateway_enabled'),
  isCODEnabled: () => isFeatureEnabled('cod_enabled'),
  getCODCharges: () => getNumericSetting('cod_charges', 50),

  // EMI settings
  isEMIEnabled: () => isFeatureEnabled('emi_enabled'),
  getEMIMinimumAmount: () => getNumericSetting('emi_minimum_amount', 10000),

  // Feature flags
  isReviewsEnabled: () => isFeatureEnabled('reviews_enabled'),
  isWishlistEnabled: () => isFeatureEnabled('wishlist_enabled'),
  isGuestCheckoutEnabled: () => isFeatureEnabled('guest_checkout_enabled'),
  isProductComparisonEnabled: () => isFeatureEnabled('product_comparison_enabled'),

  // SEO settings
  getMetaTitle: () => getSetting('meta_title'),
  getMetaDescription: () => getSetting('meta_description'),
  getMetaKeywords: () => getSetting('meta_keywords'),
};