const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ─── Hash the passwords ───
  const adminPassword = await bcrypt.hash("admin1234", 10);
  const merchantPassword = await bcrypt.hash("merchant1234", 10);

  // ─── Admin user ───
  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {}, // do nothing if exists
    create: {
      email: "admin@test.com",
      password: adminPassword,
      fullName: "Admin User",
      phoneNumber: "8888888888",
      role: "ADMIN",
      status: "ACTIVE",
      wallet: {
        create: {
          balance: 0,
          status: "ACTIVE",
        },
      },
    },
  });
  console.log(`✓ Admin ready: ${admin.email}`);

  // ─── Merchant user ───
  const merchant = await prisma.user.upsert({
    where: { email: "merchant1@test.com" },
    update: {},
    create: {
      email: "merchant1@test.com",
      password: merchantPassword,
      fullName: "Merchant One",
      phoneNumber: "9999911111",
      role: "MERCHANT",
      status: "ACTIVE",
      wallet: {
        create: {
          balance: 0,
          status: "ACTIVE",
        },
      },
    },
  });
  console.log(`✓ Merchant ready: ${merchant.email}`);

  // ─── A verified channel for the merchant ───
  const channel = await prisma.channel.upsert({
    where: {
      ifscCode_accountNumber: {
        ifscCode: "HDFC0001234",
        accountNumber: "1234567890",
      },
    },
    update: {},
    create: {
      userId: merchant.id,
      bankName: "HDFC Bank",
      accountHolderName: "Merchant One",
      accountNumber: "1234567890",
      ifscCode: "HDFC0001234",
      status: "VERIFIED",
    },
  });
  console.log(`✓ Channel ready: ${channel.bankName} (VERIFIED)`);

  // ─── Set this channel as the merchant's selected one ───
  await prisma.user.update({
    where: { id: merchant.id },
    data: { selectedChannelId: channel.id },
  });
  console.log("✓ Selected channel assigned to merchant");

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────────────");
  console.log("Admin    → admin@test.com / admin1234");
  console.log("Merchant → merchant1@test.com / merchant1234");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });