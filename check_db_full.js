const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== GLOBAL SETTINGS ===");
  try {
    const settings = await prisma.globalSettings.findMany();
    console.log(settings);
  } catch (e) {
    console.error(e);
  }

  console.log("\n=== REVIEWS ===");
  try {
    const reviews = await prisma.review.findMany({
      include: {
        pizzeria: true
      }
    });
    reviews.forEach(r => {
      console.log(`- Review by ${r.userId} for ${r.pizzeria.name}: rating = ${r.rating}, comment = "${r.comment}"`);
    });
  } catch (e) {
    console.error(e);
  }

  console.log("\n=== PIZZERIAS ===");
  try {
    const pizzerias = await prisma.pizzeria.findMany();
    pizzerias.forEach(p => {
      console.log(`- ${p.name} (id: ${p.id}): imageUrl = "${p.imageUrl}"`);
    });
  } catch (e) {
    console.error(e);
  }

  await prisma.$disconnect();
}

main();
