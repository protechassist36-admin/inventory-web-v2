import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prismaClient = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClient;

/**
 * Creates a tenant-scoped Prisma client extension.
 * This automatically injects `businessId` filtering into all tenant-owned models.
 */
export const getTenantPrisma = (businessId: string) => {
  return prismaClient.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          args.where = { ...args.where, businessId };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, businessId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, businessId };
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...args.where, businessId };
          return query(args);
        },
        async delete({ args, query }) {
          args.where = { ...args.where, businessId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, businessId };
          return query(args);
        },
      },
    },
  });
};

export const prisma = prismaClient;
