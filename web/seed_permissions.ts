import { prisma } from "./src/lib/prisma";

async function main() {
  const permissions = [
    { key: "product:create" },
    { key: "product:edit" },
    { key: "product:delete" },
    { key: "sales:create" },
    { key: "sales:view" },
    { key: "staff:view" },
    { key: "staff:edit" },
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
