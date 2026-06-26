const { DatabaseSync } = require('node:sqlite');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

// Helper to convert SQLite dates and booleans
function mapRow(row, tableName) {
  const mapped = { ...row };
  
  // Convert dates
  for (const key in mapped) {
    const val = mapped[key];
    if (val !== null && val !== undefined) {
      const isDateKey = key.endsWith('At') || key === 'expires' || key === 'emailVerified' || key === 'repliedAt' || key === 'createdAt' || key === 'updatedAt';
      
      if (typeof val === 'string' && (isDateKey || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val))) {
        mapped[key] = new Date(val);
      } else if (typeof val === 'number' && isDateKey) {
        mapped[key] = new Date(val);
      }
    }
  }

  // Convert SQLite booleans (0/1) to real JS booleans
  if (tableName === 'User' && mapped.hasOwnProperty('isAdmin')) {
    mapped.isAdmin = mapped.isAdmin === 1;
  }

  return mapped;
}

async function main() {
  const dbPath = path.join(__dirname, 'prisma', 'dev.db');
  console.log("📂 Opening local SQLite database:", dbPath);
  const sqliteDb = new DatabaseSync(dbPath);

  console.log("🔗 Connecting to cloud PostgreSQL database via Prisma...");
  await prisma.$connect();

  // Define tables to migrate in order to satisfy foreign keys
  const migrationPlan = [
    { name: 'User', prismaModel: prisma.user },
    { name: 'Pizzeria', prismaModel: prisma.pizzeria },
    { name: 'FooterSection', prismaModel: prisma.footerSection },
    { name: 'FaqCategory', prismaModel: prisma.faqCategory },
    { name: 'FooterLink', prismaModel: prisma.footerLink },
    { name: 'FaqQuestion', prismaModel: prisma.faqQuestion },
    { name: 'Review', prismaModel: prisma.review },
    { name: 'MenuItem', prismaModel: prisma.menuItem },
    { name: 'FooterConfig', prismaModel: prisma.footerConfig },
    { name: 'SocialLink', prismaModel: prisma.socialLink },
    { name: 'Testimonial', prismaModel: prisma.testimonial },
    { name: 'GlobalSettings', prismaModel: prisma.globalSettings },
    { name: 'FeatureCard', prismaModel: prisma.featureCard },
    { name: 'HelpCenterCard', prismaModel: prisma.helpCenterCard },
    { name: 'AboutContent', prismaModel: prisma.aboutContent }
  ];

  console.log("\n🧹 Cleaning existing placeholder data in cloud PostgreSQL...");
  // Clear children first, then parents
  const reversePlan = [...migrationPlan].reverse();
  for (const table of reversePlan) {
    try {
      const count = await table.prismaModel.count();
      if (count > 0) {
        console.log(`- Deleting ${count} rows from PostgreSQL table: ${table.name}`);
        await table.prismaModel.deleteMany({});
      }
    } catch (e) {
      console.warn(`⚠️ Warning clearing PostgreSQL table ${table.name}:`, e.message);
    }
  }

  console.log("\n🚀 Starting data migration from SQLite to cloud PostgreSQL...");
  for (const table of migrationPlan) {
    try {
      // 1. Fetch from SQLite
      const sqliteRows = sqliteDb.prepare(`SELECT * FROM "${table.name}";`).all();
      console.log(`- Table ${table.name}: found ${sqliteRows.length} rows in SQLite`);

      if (sqliteRows.length === 0) continue;

      // 2. Map and insert into PostgreSQL
      for (const sqliteRow of sqliteRows) {
        const data = mapRow(sqliteRow, table.name);
        
        await table.prismaModel.create({
          data
        });
      }
      console.log(`  ✅ Successfully migrated ${sqliteRows.length} rows to PostgreSQL table: ${table.name}`);
    } catch (error) {
      console.error(`  ❌ Error migrating table ${table.name}:`, error);
      process.exit(1);
    }
  }

  console.log("\n🎉 Database migration completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Critical error during migration:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
