import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';
import type { Role } from '../generated/prisma/client';
import { AuthUtilsService } from '../src/auth/helper/auth-utils';

// Generate unique customer ID
function generateCustomerId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// DB adapter
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 10,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('\n🌱 Starting Prisma Seed...\n');

  const rootPassword = AuthUtilsService.hashPasswordforSeed('Root@123');
  const adminPassword = AuthUtilsService.hashPasswordforSeed('Admin@123');

  // ========================================
  // 1️⃣ CREATE ROOT USER WITH NULL ROLE FIRST
  // ========================================
  console.log('👑 Creating ROOT user (Root table)...');
  const rootUser = await prisma.root.upsert({
    where: { username: 'root' },
    update: {},
    create: {
      username: 'root',
      firstName: 'Super',
      lastName: 'Admin',
      email: 'azunisoftware18@gmail.com',
      phoneNumber: '9999999990',
      password: rootPassword,
      status: 'ACTIVE',
      hierarchyLevel: 0,
      hierarchyPath: '0',
      roleId: null, // Will be updated later
      refreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastLoginAt: null,
      lastLoginIp: null,
      lastLoginOrigin: null,
      deactivationReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  });

  console.log('✅ ROOT user created');

  // ========================================
  // 2️⃣ CREATE ROLES (now that root exists)
  // ========================================
  console.log('🔐 Creating roles...');
  const rolesData = [
    {
      name: 'ROOT',
      hierarchyLevel: 0,
      description: 'Full system access (for Root users)',
    },
    {
      name: 'ADMIN',
      hierarchyLevel: 1,
      description: 'Admin level privileges',
    },
    {
      name: 'AGENT',
      hierarchyLevel: 2,
      description: 'Agent level privileges',
    },
    {
      name: 'DISTRIBUTOR',
      hierarchyLevel: 3,
      description: 'Distributor level privileges',
    },
    {
      name: 'RETAILER',
      hierarchyLevel: 4,
      description: 'Retailer level privileges',
    },
    {
      name: 'CUSTOMER',
      hierarchyLevel: 5,
      description: 'Customer level privileges',
    },
  ];

  const createdRoles: Role[] = [];

  for (const role of rolesData) {
    const newRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        hierarchyLevel: role.hierarchyLevel,
        description: role.description,
        createdByType: 'ROOT',
        createdByRootId: rootUser.id,
        createdByUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    createdRoles.push(newRole);
  }

  console.log('✅ Roles created:', createdRoles.map((r) => r.name).join(', '));

  const ROOT_ROLE = createdRoles.find((r) => r.name === 'ROOT')!;
  const ADMIN_ROLE = createdRoles.find((r) => r.name === 'ADMIN')!;

  // ========================================
  // 3️⃣ ASSIGN ROOT ROLE TO ROOT USER
  // ========================================
  console.log('🔗 Assigning ROOT role to root user...');
  await prisma.root.update({
    where: { id: rootUser.id },
    data: { roleId: ROOT_ROLE.id },
  });

  console.log('✅ ROOT role assigned');

  // ========================================
  // 4️⃣ CREATE ADMIN USER (in User table)
  // ========================================
  console.log('👤 Creating ADMIN user (User table)...');

  // Generate unique customer ID for admin
  const adminCustomerId = generateCustomerId();

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@system.com',
      phoneNumber: '9999999991',
      password: adminPassword,
      transactionPin: null,
      transactionPinSalt: null,
      parentId: null,
      hierarchyLevel: 1,
      hierarchyPath: '0.1',
      status: 'ACTIVE',
      isKycVerified: false,
      roleId: ADMIN_ROLE.id,
      refreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
      emailVerifiedAt: null,
      emailVerificationTokenExpires: null,
      lastLoginAt: null,
      deactivationReason: null,
      customerId: adminCustomerId,
      rootParentId: rootUser.id, // Root is the parent
      businessKycId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  });

  console.log('✅ ADMIN user created with customer ID:', adminCustomerId);

  // ========================================
  // 5️⃣ CREATE ROOT WALLETS
  // ========================================
  console.log('💰 Creating root wallets...');
  await prisma.rootWallet.upsert({
    where: {
      rootId_walletType: { rootId: rootUser.id, walletType: 'PRIMARY' },
    },
    update: {},
    create: {
      rootId: rootUser.id,
      balance: 0,
      currency: 'INR',
      walletType: 'PRIMARY',
      holdBalance: 0,
      availableBalance: 0,
      isActive: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Root wallet created');

  // ========================================
  // 6️⃣ CREATE USER WALLET FOR ADMIN
  // ========================================
  console.log('💳 Creating user wallet for admin...');
  await prisma.wallet.upsert({
    where: {
      userId_walletType: { userId: adminUser.id, walletType: 'PRIMARY' },
    },
    update: {},
    create: {
      userId: adminUser.id,
      balance: 100000, // Starting balance for admin
      currency: 'INR',
      walletType: 'PRIMARY',
      holdBalance: 0,
      availableBalance: 100000,
      dailyLimit: 1000000,
      monthlyLimit: 10000000,
      perTransactionLimit: 500000,
      isActive: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  });

  console.log('✅ Admin wallet created');

  // ========================================
  // 7️⃣ CREATE ROOT IP WHITELIST
  // ========================================
  console.log('🌐 Creating IP whitelists...');
  await prisma.ipWhitelist.upsert({
    where: { domainName: 'http://localhost:5174' },
    update: {},
    create: {
      domainName: 'http://localhost:5174',
      serverIp: '127.0.0.1',
      rootId: rootUser.id,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // ========================================
  // 8️⃣ CREATE USER IP WHITELIST FOR ADMIN
  // ========================================
  await prisma.ipWhitelist.upsert({
    where: { domainName: 'http://localhost:5173' },
    update: {},
    create: {
      domainName: 'http://localhost:5173',
      serverIp: '127.0.0.1',
      rootId: null,
      userId: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ IP whitelists created');

  console.log('\n🎉 Seed Completed Successfully!\n');
  console.log('====================================');
  console.log('SYSTEM USERS:');
  console.log(`ROOT (Root table):`);
  console.log(`  Username: ${rootUser.username}`);
  console.log(`  Email: ${rootUser.email}`);
  console.log(`  Phone: ${rootUser.phoneNumber}`);
  console.log(`  Role: ${ROOT_ROLE.name}`);
  console.log('');
  console.log(`ADMIN (User table):`);
  console.log(`  Username: ${adminUser.username}`);
  console.log(`  Email: ${adminUser.email}`);
  console.log(`  Phone: ${adminUser.phoneNumber}`);
  console.log(`  Customer ID: ${adminUser.customerId}`);
  console.log(`  Role: ${ADMIN_ROLE.name}`);
  console.log(`  Parent: Root`);
  console.log('====================================');
  console.log('Default Password for both: "Root@123"');
  console.log('====================================\n');
  console.log('Access URLs:');
  console.log('- Root Panel: http://localhost:5174');
  console.log('- Admin Panel: http://localhost:5173');
  console.log('====================================\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
  })
  .catch(async (err) => {
    console.error('❌ Seed Error:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
