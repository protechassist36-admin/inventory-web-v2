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
  const permissions = [
    // Menu Access Permissions
    { key: "menu:overview" },
    { key: "menu:intelligence_hub" },
    { key: "menu:analytics" },
    { key: "menu:reports" },
    
    { key: "menu:inventory" },
    { key: "menu:inventory:products" },
    { key: "menu:inventory:network" },
    { key: "menu:inventory:categories" },
    { key: "menu:inventory:batches" },
    { key: "menu:inventory:history" },
    { key: "menu:inventory:expiry" },
    
    { key: "menu:purchases" },
    { key: "menu:purchases:suppliers" },
    { key: "menu:purchases:orders" },
    { key: "menu:purchases:returns" },
    
    { key: "menu:sales" },
    { key: "menu:sales:pos" },
    { key: "menu:sales:history" },
    { key: "menu:sales:orders" },
    { key: "menu:sales:credit" },
    { key: "menu:sales:returns" },
    
    { key: "menu:customers" },
    { key: "menu:customers:registry" },
    { key: "menu:customers:loyalty" },
    { key: "menu:customers:profiles" },
    
    { key: "menu:accounting" },
    { key: "menu:accounting:expenses" },
    { key: "menu:accounting:pl" },
    { key: "menu:accounting:cashflow" },
    { key: "menu:accounting:billing" },
    
    { key: "menu:staff" },
    { key: "menu:staff:employees" },
    { key: "menu:staff:attendance" },
    { key: "menu:staff:payroll" },
    
    { key: "menu:system" },
    { key: "menu:system:logs" },
    { key: "menu:system:notifications" },
    { key: "menu:system:settings" },
    
    { key: "menu:support" },
    { key: "menu:support:manual" },
    { key: "menu:support:pricing" },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: {},
      create: { key: p.key },
    });
  }
  console.log('✅ Permissions seeded.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
