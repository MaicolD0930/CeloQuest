require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  const admins = await prisma.admin.findMany();
  const users = await prisma.user.findMany({
    where: {
      walletAddress: { contains: "089189", mode: "insensitive" },
    },
    select: { walletAddress: true, username: true },
  });
  console.log("admins:", JSON.stringify(admins, null, 2));
  console.log("users:", JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
