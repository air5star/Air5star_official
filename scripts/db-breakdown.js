const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const totalProducts = await prisma.product.count();
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });

  const breakdown = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    products: c._count.products,
  }));

  console.log(JSON.stringify({ totalProducts, categoryCount: categories.length, breakdown }, null, 2));
})()
  .catch(async (e) => {
    console.error('Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });