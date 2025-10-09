const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // Create categories
    console.log('📁 Creating categories...');
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { slug: 'air-conditioners' },
        update: {},
        create: {
          name: 'Air Conditioners',
          slug: 'air-conditioners',
          description: 'Cooling solutions for homes and offices',
          isActive: true,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'heating-systems' },
        update: {},
        create: {
          name: 'Heating Systems',
          slug: 'heating-systems',
          description: 'Heating solutions for cold weather',
          isActive: true,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'ventilation' },
        update: {},
        create: {
          name: 'Ventilation',
          slug: 'ventilation',
          description: 'Air circulation and ventilation systems',
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // Create test user
    console.log('👤 Creating test user...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        phone: '9876543210',
        provider: 'credentials',
      },
    });

    console.log('✅ Created test user');

    // Create products
    console.log('🛍️ Creating products...');
    const products = [];
    
    for (let i = 1; i <= 10; i++) {
      const categoryIndex = (i - 1) % categories.length;
      const category = categories[categoryIndex];
      
      const product = await prisma.product.create({
        data: {
          name: `HVAC Product ${i}`,
          description: `High-quality HVAC product ${i} with advanced features`,
          sku: `HVAC-${String(i).padStart(3, '0')}`,
          price: 15000 + (i * 5000),
          mrp: 20000 + (i * 5000),
          categoryId: category.id,
          subCategory: i % 2 === 0 ? 'Split AC' : 'Window AC',
          brand: i % 2 === 0 ? 'Samsung' : 'LG',
          imageUrl: `https://via.placeholder.com/600x400?text=Product+${i}`,
          specifications: {
            'Power': `${1000 + (i * 200)}W`,
            'Capacity': `${i} Ton`,
            'Energy Rating': `${3 + (i % 3)} Star`,
            'Room Size': `${200 + (i * 50)} sq ft`,
            'Warranty': '2 years'
          },
          thumbnailImages: [
            `https://via.placeholder.com/600x400?text=Product+${i}+Image+1`,
            `https://via.placeholder.com/600x400?text=Product+${i}+Image+2`
          ],
          isActive: true,
        },
      });
      
      // Create inventory for each product
      await prisma.inventory.create({
        data: {
          productId: product.id,
          stockQuantity: 50 + (i * 10),
          reservedQuantity: 0,
          lowStockThreshold: 10,
        },
      });
      
      products.push(product);
    }

    console.log(`✅ Created ${products.length} products with inventory`);

    // Create some reviews
    console.log('⭐ Creating reviews...');
    for (let i = 0; i < 5; i++) {
      const product = products[i % products.length];
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: testUser.id,
          rating: 4 + (i % 2),
          comment: `This is an excellent HVAC product. Very satisfied with the quality and performance.`,
          isApproved: true,
        },
      });
    }

    console.log('✅ Created reviews');

    // Create EMI plans
    console.log('💳 Creating EMI plans...');
    const emiPlans = await Promise.all([
      prisma.emiPlan.create({
        data: {
          name: '3 Months EMI',
          months: 3,
          interestRate: 12.0,
          minAmount: 10000,
          maxAmount: 100000,
          isActive: true,
        },
      }),
      prisma.emiPlan.create({
        data: {
          name: '6 Months EMI',
          months: 6,
          interestRate: 14.0,
          minAmount: 15000,
          maxAmount: 200000,
          isActive: true,
        },
      }),
      prisma.emiPlan.create({
        data: {
          name: '12 Months EMI',
          months: 12,
          interestRate: 16.0,
          minAmount: 25000,
          maxAmount: 500000,
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Created ${emiPlans.length} EMI plans`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Test credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });