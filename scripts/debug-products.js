const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('=== PRODUCT DEBUG ANALYSIS ===\n');
  
  // Get total count
  const totalProducts = await prisma.product.count();
  console.log(`Total products in database: ${totalProducts}\n`);
  
  // Get active vs inactive products
  const activeProducts = await prisma.product.count({ where: { isActive: true } });
  const inactiveProducts = await prisma.product.count({ where: { isActive: false } });
  console.log(`Active products: ${activeProducts}`);
  console.log(`Inactive products: ${inactiveProducts}\n`);
  
  // Get products by category
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  });
  
  console.log('Products by category:');
  categories.forEach(cat => {
    console.log(`  ${cat.name}: ${cat._count.products} products`);
  });
  console.log('');
  
  // Get sample products from each category
  console.log('Sample products from each category:');
  for (const category of categories) {
    const sampleProducts = await prisma.product.findMany({
      where: { categoryId: category.id },
      take: 3,
      select: {
        id: true,
        name: true,
        sku: true,
        isActive: true,
        inventory: {
          select: {
            stockQuantity: true,
            reservedQuantity: true
          }
        }
      }
    });
    
    console.log(`\n${category.name} (${category.slug}):`);
    sampleProducts.forEach(product => {
      const stock = product.inventory?.stockQuantity || 0;
      const reserved = product.inventory?.reservedQuantity || 0;
      const available = stock - reserved;
      console.log(`  - ID: ${product.id}, SKU: ${product.sku}, Active: ${product.isActive}, Stock: ${available}/${stock}`);
      console.log(`    Name: ${product.name.substring(0, 60)}...`);
    });
  }
  
  // Check for products with problematic data
  console.log('\n=== POTENTIAL ISSUES ===');
  
  // Products without inventory
  const productsWithoutInventory = await prisma.product.count({
    where: {
      inventory: null
    }
  });
  console.log(`Products without inventory: ${productsWithoutInventory}`);
  
  // Products with zero or negative stock
  const productsWithZeroStock = await prisma.product.count({
    where: {
      inventory: {
        stockQuantity: {
          lte: 0
        }
      }
    }
  });
  console.log(`Products with zero/negative stock: ${productsWithZeroStock}`);
  
  // Products with invalid SKU patterns - skip this check for now
  console.log(`Products with invalid SKU: Skipping check due to Prisma constraints`);
  
  console.log('\n=== CART TESTING ===');
  
  // Test a few specific product IDs to see if they can be found
  const testProductIds = ['1', '2', '3', '30', '50'];
  
  for (const testId of testProductIds) {
    // Test direct ID lookup
    const directProduct = await prisma.product.findFirst({
      where: {
        id: testId,
        isActive: true,
      }
    });
    
    // Test SKU pattern lookup
    const skuProduct = await prisma.product.findFirst({
      where: {
        sku: { contains: `_${testId}` },
        isActive: true,
      }
    });
    
    console.log(`Test ID ${testId}: Direct=${!!directProduct}, SKU=${!!skuProduct}`);
    if (directProduct) console.log(`  Direct found: ${directProduct.name.substring(0, 40)}...`);
    if (skuProduct) console.log(`  SKU found: ${skuProduct.name.substring(0, 40)}...`);
  }
  
})()
  .catch(async (e) => {
    console.error('Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });