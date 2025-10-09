const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const products = await prisma.product.count();
  const categories = await prisma.category.count();
  const inventory = await prisma.inventory.count();
  const cartItems = await prisma.cartItem.count();
  console.log(JSON.stringify({ products, categories, inventory, cartItems }, null, 2));
})()
  .catch(async (e) => {
    console.error('Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });