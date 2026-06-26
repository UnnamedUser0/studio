const { DatabaseSync } = require('node:sqlite');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log("=== SQLITE (dev.db) ===");
  try {
    const dbPath = path.join(__dirname, 'prisma', 'dev.db');
    const db = new DatabaseSync(dbPath);
    const rows = db.prepare('SELECT id, name, imageUrl FROM "Pizzeria"').all();
    rows.forEach(r => {
      console.log(`- ${r.name} (ID: ${r.id}): imageUrl = "${r.imageUrl}"`);
    });
  } catch (error) {
    console.error("SQLite error:", error);
  }

  console.log("\n=== POSTGRESQL (Neon) ===");
  try {
    const rows = await prisma.pizzeria.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true
      }
    });
    rows.forEach(r => {
      console.log(`- ${r.name} (ID: ${r.id}): imageUrl = "${r.imageUrl}"`);
    });
  } catch (error) {
    console.error("PostgreSQL error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
