const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to Prisma...");
  try {
    const categories = await prisma.faqCategory.findMany();
    console.log("Connection successful! Categories count:", categories.length);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
