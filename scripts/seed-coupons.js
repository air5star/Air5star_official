const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCoupons() {
  try {
    // Create sample coupons
    const coupons = [
      {
        code: 'WELCOME20',
        name: 'Welcome Discount',
        description: '20% off for new customers',
        type: 'PERCENTAGE',
        value: 20,
        minOrderAmount: 100,
        maxDiscountAmount: 500,
        usageLimit: 1000,
        userUsageLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true
      },
      {
        code: 'SAVE10',
        name: 'Save 10%',
        description: '10% discount on all orders',
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: 50,
        maxDiscountAmount: 200,
        usageLimit: 500,
        userUsageLimit: 3,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        isActive: true
      },
      {
        code: 'FLAT100',
        name: 'Flat ₹100 Off',
        description: 'Get flat ₹100 off on orders above ₹500',
        type: 'FIXED_AMOUNT',
        value: 100,
        minOrderAmount: 500,
        usageLimit: 200,
        userUsageLimit: 2,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        isActive: true
      },
      {
        code: 'FREESHIP',
        name: 'Free Shipping',
        description: 'Free shipping on all orders',
        type: 'FREE_SHIPPING',
        value: 0,
        minOrderAmount: 200,
        usageLimit: 300,
        userUsageLimit: 5,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        isActive: true
      },
      {
        code: 'SUMMER25',
        name: 'Summer Sale',
        description: '25% off summer collection',
        type: 'PERCENTAGE',
        value: 25,
        minOrderAmount: 300,
        maxDiscountAmount: 1000,
        usageLimit: 150,
        userUsageLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        isActive: true
      }
    ];

    for (const couponData of coupons) {
      const existingCoupon = await prisma.coupon.findUnique({
        where: { code: couponData.code }
      });

      if (!existingCoupon) {
        await prisma.coupon.create({
          data: couponData
        });
        console.log(`Created coupon: ${couponData.code}`);
      } else {
        console.log(`Coupon ${couponData.code} already exists`);
      }
    }

    console.log('Coupon seeding completed!');
  } catch (error) {
    console.error('Error seeding coupons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCoupons();