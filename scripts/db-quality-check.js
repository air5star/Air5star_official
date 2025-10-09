const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function availableStock(inv) {
  if (!inv) return 0;
  const stock = inv.stockQuantity ?? 0;
  const reserved = inv.reservedQuantity ?? 0;
  return Math.max(stock - reserved, 0);
}

(async () => {
  const products = await prisma.product.findMany({
    include: { inventory: true, category: true },
  });

  const totalProducts = products.length;
  const withInventory = products.filter(p => !!p.inventory).length;
  const missingInventory = totalProducts - withInventory;
  const inactiveProducts = products.filter(p => !p.isActive).length;
  const missingSKU = products.filter(p => !p.sku || p.sku.trim() === '').length;
  const zeroPrice = products.filter(p => !p.price || p.price <= 0).length;
  const missingMRP = products.filter(p => !p.mrp || p.mrp <= 0).length;
  const missingImage = products.filter(p => !p.imageUrl || p.imageUrl.trim() === '').length;
  const missingCategoryRel = products.filter(p => !p.category || !p.categoryId).length;
  const noAvailableStock = products.filter(p => availableStock(p.inventory) <= 0).length;

  const sample = products.slice(0, 5).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    mrp: p.mrp,
    sku: p.sku,
    category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
    inventory: p.inventory ? {
      stockQuantity: p.inventory.stockQuantity,
      reservedQuantity: p.inventory.reservedQuantity,
      lowStockThreshold: p.inventory.lowStockThreshold,
      availableStock: availableStock(p.inventory),
    } : null,
    isActive: p.isActive,
    hasThumbnails: Array.isArray(p.thumbnailImages) ? p.thumbnailImages.length : 0,
  }));

  console.log(JSON.stringify({
    totals: {
      totalProducts,
      withInventory,
      missingInventory,
      inactiveProducts,
      missingSKU,
      zeroPrice,
      missingMRP,
      missingImage,
      missingCategoryRel,
      noAvailableStock,
    },
    sample,
  }, null, 2));
})()
  .catch(async (e) => {
    console.error('Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });