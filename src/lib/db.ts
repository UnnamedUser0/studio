import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const getPrismaClient = () => {
  const isNetlifyRuntime = process.env.LAMBDA_TASK_ROOT && process.env.NETLIFY;
  if (isNetlifyRuntime) {
    return new PrismaClient({
      datasources: {
        db: {
          url: "file:/var/task/prisma/dev.db",
        },
      },
    });
  }
  return new PrismaClient();
};

export const prisma = globalForPrisma.prisma || getPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
