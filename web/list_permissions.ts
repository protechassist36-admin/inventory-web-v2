import { prisma } from "./src/lib/prisma";

async function main() {
  const permissions = await prisma.permission.findMany({
    orderBy: { key: 'asc' }
  });
  console.log(JSON.stringify(permissions, null, 2));
  await prisma.$disconnect();
}

main();
