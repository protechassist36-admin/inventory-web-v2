import { prisma } from "@/lib/prisma";

async function main() {
  const permissions = await prisma.permission.findMany();
  console.log('Available permissions:', permissions);
  await prisma.$disconnect();
}

main();
