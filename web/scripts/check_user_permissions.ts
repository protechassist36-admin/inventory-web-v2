
import { prisma } from "../src/lib/prisma";

async function checkUser() {
  try {
      const user = await prisma.user.findFirst({
        where: { name: { contains: 'Nancy' } },
        include: { role: { include: { permissions: true } } }
      });
      
      if (!user) {
        console.log("User not found");
        return;
      }
      
      console.log("User:", user.name);
      console.log("Role:", user.role?.name);
      console.log("Permissions:", user.role?.permissions.map(p => p.key));
  } catch (e) {
      console.error(e);
  } finally {
      await prisma.$disconnect();
  }
}

checkUser();
