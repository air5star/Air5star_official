const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdminUsers() {
  try {
    console.log('🌱 Seeding admin users...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin users
    const adminUsers = [
      {
        email: 'admin@hvac.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
      },
      {
        email: 'superadmin@hvac.com',
        name: 'Super Admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
      {
        email: 'manager@hvac.com',
        name: 'Manager',
        password: hashedPassword,
        role: 'ADMIN',
      }
    ];

    for (const userData of adminUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
        await prisma.user.create({
          data: userData
        });
        console.log(`✅ Created admin user: ${userData.email}`);
        console.log(`   Name: ${userData.name}`);
        console.log(`   Role: ${userData.role}`);
      } else {
        // Update existing user to have admin role
        await prisma.user.update({
          where: { email: userData.email },
          data: { role: 'ADMIN', password: hashedPassword }
        });
        console.log(`✅ Updated existing user to admin: ${userData.email}`);
        console.log(`   Name: ${userData.name}`);
        console.log(`   Role: ${userData.role}`);
      }
    }

    console.log('✅ Admin users seeded successfully!');
    console.log('📧 You can login with:');
    console.log('   Email: admin@hvac.com');
    console.log('   Password: admin123');
  } catch (error) {
    console.error('❌ Error seeding admin users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdminUsers();