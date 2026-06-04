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
    // 1. Overview
    { key: "menu:overview" },

    // 2. Intelligence Hub
    { key: "menu:intelligence:hub" },
    { key: "menu:intelligence:analytics" },
    { key: "menu:intelligence:reports" },
    { key: "menu:intelligence:supply_chain" },
    
    // 3. Inventory
    { key: "menu:inventory" },
    { key: "menu:inventory:products" },
    { key: "menu:inventory:network" },
    { key: "menu:inventory:categories" },
    { key: "menu:inventory:batches" },
    { key: "menu:inventory:history" },
    { key: "menu:inventory:expiry" },
    
    // 4. Purchases
    { key: "menu:purchases" },
    { key: "menu:purchases:suppliers" },
    { key: "menu:purchases:orders" },
    { key: "menu:purchases:returns" },
    
    // 5. Commerce (Sales)
    { key: "menu:sales" },
    { key: "menu:sales:pos" },
    { key: "menu:sales:history" },
    { key: "menu:sales:orders" },
    { key: "menu:sales:credit" },
    { key: "menu:sales:returns" },
    
    // 6. Relationships (Customers)
    { key: "menu:customers" },
    { key: "menu:customers:registry" },
    { key: "menu:customers:loyalty" },
    { key: "menu:customers:profiles" },
    
    // 7. Finance (Accounting)
    { key: "menu:accounting" },
    { key: "menu:accounting:expenses" },
    { key: "menu:accounting:pl" },
    { key: "menu:accounting:cashflow" },
    { key: "menu:accounting:billing" },
    
    // 8. Administrative (Team/HR)
    { key: "menu:staff" },
    { key: "menu:staff:employees" },
    { key: "menu:staff:attendance" },
    { key: "menu:staff:payroll" },
    
    // 9. System
    { key: "menu:system" },
    { key: "menu:system:logs" },
    { key: "menu:system:notifications" },
    { key: "menu:system:settings" },
    
    // 10. Support
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
  
  // Cleanup old keys if any (optional but good for consistency)
  const allPerms = await prisma.permission.findMany();
  const validKeys = permissions.map(p => p.key);
  for (const p of allPerms) {
    if (!validKeys.includes(p.key)) {
      console.log(`Removing obsolete permission: ${p.key}`);
      await prisma.permission.delete({ where: { id: p.id } });
    }
  }

  console.log('✅ Permissions seeded and synchronized.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
