const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSecureAdmin() {
  try {
    console.log('🔐 Creating secure admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create secure admin credentials
    const adminEmail = 'admin@air5star.com';
    const adminPassword = 'Admin@123!'; // Strong default password - should be changed after first login
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        provider: 'credentials',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Secure admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  IMPORTANT: Please change the default password after first login!');
    console.log('🆔 Admin ID:', admin.id);

    // Create additional admin users if needed
    const additionalAdmins = [
      {
        name: 'Technical Admin',
        email: 'tech@air5star.com',
        password: 'TechAdmin@456!',
        role: 'ADMIN'
      }
    ];

    for (const adminData of additionalAdmins) {
      const existingUser = await prisma.user.findUnique({
        where: { email: adminData.email }
      });

      if (!existingUser) {
        const hashedPwd = await bcrypt.hash(adminData.password, 12);
        const newAdmin = await prisma.user.create({
          data: {
            name: adminData.name,
            email: adminData.email,
            password: hashedPwd,
            role: adminData.role,
            isActive: true,
            provider: 'credentials'
          }
        });
        console.log(`✅ Additional admin created: ${newAdmin.email}`);
      }
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSecureAdmin()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });