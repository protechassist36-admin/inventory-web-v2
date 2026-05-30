import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  // Debug logging
  console.log('DEBUG: SUPER_ADMIN_PASSWORD is', process.env.SUPER_ADMIN_PASSWORD ? 'SET' : 'NOT SET');

  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@protechnexus.com';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('❌ Error: SUPER_ADMIN_PASSWORD environment variable is not set.');
    process.exit(1);
  }

  console.log('🚀 Starting Super Admin seeding...');

  try {
    // 1. Create a System Business
    const systemBusiness = await prisma.business.upsert({
      where: { slug: 'protech-nexus-core' },
      update: {},
      create: {
        name: 'Protech Assist SL Limited Super Admin Hub',
        slug: 'protech-nexus-core',
        type: 'SHOP',
        plan: 'PREMIUM',
        status: 'active',
        enabledModules: ['POS', 'INVENTORY', 'RESTAURANT'],
      },
    });

    // 2. Create SUPERADMIN role
    const superAdminRole = await prisma.role.upsert({
      where: { businessId_name: { businessId: systemBusiness.id, name: 'SUPERADMIN' } },
      update: {},
      create: {
        name: 'SUPERADMIN',
        businessId: systemBusiness.id,
      },
    });

    // 3. Create/Update Super Admin User
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: { connect: { id: superAdminRole.id } },
        passwordHash: hashedPassword,
      },
      create: {
        email: adminEmail,
        name: 'Nexus System Admin',
        passwordHash: hashedPassword,
        role: { connect: { id: superAdminRole.id } },
        business: {
          connect: { id: systemBusiness.id }
        }
      },
    });

    console.log('✅ Super Admin account seeded successfully.');
    console.log(`👤 Email: ${adminEmail}`);
  } catch (error) {
    console.error('❌ Failed to seed Super Admin:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Unexpected error in seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
