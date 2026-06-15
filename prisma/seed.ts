import { PrismaClient } from "@prisma/client";
import { questions } from "./questions-bank";

const prisma = new PrismaClient();

async function main() {
  const force =
    process.env.FORCE_SEED === "1" || process.argv.includes("--force");
  const existing = await prisma.question.count();

  if (existing > 0 && !force) {
    console.log(`Database already has ${existing} questions — skipping seed.`);
    console.log("To re-seed: npm run db:seed:force");
    return;
  }

  if (force && existing > 0) {
    console.log("FORCE_SEED: clearing questions...");
    await prisma.questionTranslation.deleteMany();
    await prisma.question.deleteMany();
  }

  console.log("Seeding database...");
  for (const q of questions) {
    await prisma.question.create({
      data: {
        category: q.category,
        difficulty: q.difficulty,
        correctIndex: q.correctIndex,
        translations: {
          create: [
            {
              locale: "es",
              text: q.es.text,
              options: JSON.stringify(q.es.options),
              explanation: q.es.explanation,
            },
            {
              locale: "en",
              text: q.en.text,
              options: JSON.stringify(q.en.options),
              explanation: q.en.explanation,
            },
          ],
        },
      },
    });
  }

  const count = await prisma.question.count();
  console.log(`Seeded ${count} questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
