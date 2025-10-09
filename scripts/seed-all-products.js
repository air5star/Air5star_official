const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function extractProductsData(tsxPath) {
  const content = fs.readFileSync(tsxPath, 'utf8');
  const exportIdx = content.indexOf('export const productsData');
  if (exportIdx === -1) throw new Error('productsData export not found');

  // Find start of array '[' after the export declaration
  const startBracketIdx = content.indexOf('[', exportIdx);
  if (startBracketIdx === -1) throw new Error('productsData array start not found');

  // Walk to matching closing ']' for the outer array
  let depth = 0;
  let endBracketIdx = -1;
  for (let i = startBracketIdx; i < content.length; i++) {
    const ch = content[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        endBracketIdx = i;
        break;
      }
    }
  }
  if (endBracketIdx === -1) throw new Error('productsData array end not found');

  const arrayText = content.slice(startBracketIdx, endBracketIdx + 1);

  // Evaluate the array text safely in a new function scope
  // The data is plain objects with literals, no external references
  const data = new Function(`return (${arrayText});`)();
  if (!Array.isArray(data)) throw new Error('productsData is not an array');
  return data;
}

function toSlug(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function buildSpecifications(prod) {
  const specs = {};
  const keys = [
    'grossVolume',
    'energyRating',
    'swing',
    'inverter_non_inverter',
    'model',
    'power',
    'speed',
    'gst',
  ];
  for (const k of keys) {
    if (prod[k] !== undefined && prod[k] !== null && prod[k] !== '') {
      specs[k] = prod[k];
    }
  }
  return Object.keys(specs).length ? specs : null;
}

function buildThumbnails(prod) {
  const th = prod.thumbnail_images || {};
  const arr = [];
  for (const k of ['thumbnail1', 'thumbnail2', 'thumbnail3', 'thumbnail4']) {
    if (typeof th[k] === 'string' && th[k].trim().length) arr.push(th[k]);
  }
  return arr.length ? arr : null;
}

async function main() {
  console.log('🌱 Seeding all static products from src/data.tsx ...');
  const dataPath = path.join(__dirname, '..', 'src', 'data.tsx');
  const categoriesData = extractProductsData(dataPath);

  let createdCategories = 0;
  let upsertedProducts = 0;
  let upsertedInventories = 0;

  for (const cat of categoriesData) {
    const slug = toSlug(cat.category || cat.id || cat.name);
    const name = cat.name || (slug ? slug.replace(/-/g, ' ') : 'Category');

    const category = await prisma.category.upsert({
      where: { slug },
      update: { name, isActive: true },
      create: {
        name,
        slug,
        description: `Products for ${name}`,
        isActive: true,
      },
    });
    createdCategories++;

    if (!Array.isArray(cat.products)) continue;

    for (const prod of cat.products) {
      const prodName = prod.productTitle || prod.name || 'Unnamed Product';
      const price = Number(prod.price || 0);
      const mrp = prod.mrp != null ? Number(prod.mrp) : null;
      const sku = prod.sku || `SKU_${slug}_${prod.id}`;
      const imageUrl = prod.imageUrl || null;
      const subCategory = prod.subCategory || null;
      const brand = prod.brand || null;
      const specifications = buildSpecifications(prod);
      const thumbnailImages = buildThumbnails(prod);

      const product = await prisma.product.upsert({
        where: { sku },
        update: {
          name: prodName,
          description: prod.description || null,
          price,
          mrp,
          categoryId: category.id,
          subCategory,
          brand,
          imageUrl,
          isActive: true,
          specifications,
          thumbnailImages,
        },
        create: {
          name: prodName,
          description: prod.description || null,
          price,
          mrp,
          sku,
          categoryId: category.id,
          subCategory,
          brand,
          imageUrl,
          isActive: true,
          specifications,
          thumbnailImages,
        },
      });
      upsertedProducts++;

      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: {
          stockQuantity: 100,
          reservedQuantity: 0,
          lowStockThreshold: 5,
        },
        create: {
          productId: product.id,
          stockQuantity: 100,
          reservedQuantity: 0,
          lowStockThreshold: 5,
        },
      });
      upsertedInventories++;
    }
  }

  console.log(
    `✅ Done. Categories processed: ${createdCategories}, products upserted: ${upsertedProducts}, inventories upserted: ${upsertedInventories}`
  );
}

main()
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });