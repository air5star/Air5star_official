const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSKUs() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      take: 10
    });
    
    console.log('Sample products with SKUs:');
    products.forEach(p => {
      console.log(`ID: ${p.id}, SKU: ${p.sku}, Name: ${p.name}, Category: ${p.category.name}`);
    });
    
    // Check for ventilation products specifically
    const ventilationProducts = await prisma.product.findMany({
      where: {
        category: {
          slug: 'ventilation'
        }
      },
      select: {
        id: true,
        sku: true,
        name: true
      },
      orderBy: {
        sku: 'asc'
      },
      take: 10
    });
    
    console.log('\nFirst 10 Ventilation products:');
    ventilationProducts.forEach(p => {
      console.log(`ID: ${p.id}, SKU: ${p.sku}, Name: ${p.name}`);
    });

    // Check for air conditioning products
    const acProducts = await prisma.product.findMany({
      where: {
        category: {
          slug: 'air-conditioning'
        }
      },
      select: {
        id: true,
        sku: true,
        name: true
      },
      orderBy: {
        sku: 'asc'
      },
      take: 10
    });
    
    console.log('\nFirst 10 Air Conditioning products:');
    acProducts.forEach(p => {
      console.log(`ID: ${p.id}, SKU: ${p.sku}, Name: ${p.name}`);
    });
    
    // Check if there's overlap in SKU patterns
    console.log('\nChecking for SKU pattern overlaps...');
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        sku: 'asc'
      }
    });
    
    // Look for products where SKU contains numbers that might conflict
    const skuPatterns = {};
    allProducts.forEach(p => {
      const match = p.sku.match(/_(\d+)$/);
      if (match) {
        const num = match[1];
        if (!skuPatterns[num]) {
          skuPatterns[num] = [];
        }
        skuPatterns[num].push({
          id: p.id,
          sku: p.sku,
          category: p.category.name
        });
      }
    });
    
    console.log('\nSKU number conflicts:');
    Object.keys(skuPatterns).forEach(num => {
      if (skuPatterns[num].length > 1) {
        console.log(`Number ${num}:`);
        skuPatterns[num].forEach(p => {
          console.log(`  - ${p.sku} (${p.category}) - ID: ${p.id}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSKUs();