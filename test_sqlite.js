const { DatabaseSync } = require('node:sqlite');
const path = require('path');

try {
  const dbPath = path.join(__dirname, 'prisma', 'dev.db');
  console.log("Loading SQLite database from:", dbPath);
  const db = new DatabaseSync(dbPath);

  const tablesQuery = db.prepare("SELECT name FROM sqlite_master WHERE type='table';");
  const tables = tablesQuery.all();
  console.log("Tables found in dev.db:");
  
  for (const table of tables) {
    if (table.name.startsWith('_') || table.name.startsWith('sqlite_')) continue;
    const countQuery = db.prepare(`SELECT COUNT(*) as count FROM "${table.name}";`);
    const result = countQuery.get();
    console.log(`- ${table.name}: ${result.count} rows`);
  }
} catch (error) {
  console.error("Error reading SQLite database:", error);
}
