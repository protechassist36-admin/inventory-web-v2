import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('📊 Diagnostic: Role & Permission Audit');

  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: { permissions: true }
      },
      business: true
    }
  });

  console.log(`🔍 Total Roles Found: ${roles.length}`);
  
  roles.forEach(role => {
    console.log(`- Role: [${role.name}] | Business: [${role.business?.name ?? 'No Business'}] | ID: ${role.id} | Permissions: ${role._count.permissions}`);
  });

  const users = await prisma.user.findMany({
    include: {
      role: true
    }
  });

  console.log(`\n👤 Total Users Found: ${users.length}`);
  users.forEach(user => {
    console.log(`- User: [${user.email}] | Role: [${user.role.name}]`);
  });

  console.log('\n🏁 Audit complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
