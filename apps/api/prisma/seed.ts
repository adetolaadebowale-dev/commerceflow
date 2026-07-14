import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/auth/services/password.service";

const prisma = new PrismaClient();

export const SEED_PASSWORD = "Password123!";

const seedUsers = [
  {
    email: "admin@commerceflow.local",
    firstName: "Alex",
    lastName: "Admin",
    role: "admin" as const,
  },
  {
    email: "staff@commerceflow.local",
    firstName: "Sam",
    lastName: "Staff",
    role: "staff" as const,
  },
  {
    email: "customer@commerceflow.local",
    firstName: "Casey",
    lastName: "Customer",
    role: "customer" as const,
  },
];

async function main(): Promise<void> {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        passwordHash,
        emailVerified: true,
        deletedAt: null,
      },
      create: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: true,
        passwordHash,
      },
    });
  }

  console.log("Seeded CommerceFlow identity users.");
  console.log(`Password for all seeded accounts: ${SEED_PASSWORD}`);
  for (const user of seedUsers) {
    console.log(`  - ${user.role}: ${user.email}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
