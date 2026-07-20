import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/auth/services/password.service.ts";

const prisma = new PrismaClient();

/** Shared password for all seeded identity accounts (development only). */
export const SEED_PASSWORD = "Password123!";

/** Stable IDs so local Admin Dashboard env can point at the seeded store. */
export const SEED_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
export const SEED_STORE_ID = "11111111-1111-1111-1111-111111111111";

export const SEED_ORGANIZATION_SLUG = "commerceflow-dev";
export const SEED_STORE_SLUG = "dev-store";

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

const ADMIN_EMAIL = seedUsers[0]!.email;

async function seedIdentityUsers(passwordHash: string): Promise<void> {
  for (const user of seedUsers) {
    // Email uniqueness is a partial index (active rows only); Prisma Client
    // cannot upsert on it — use findFirst + create/update instead.
    const existing = await prisma.user.findFirst({
      where: { email: user.email },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: true,
          passwordHash,
        },
      });
      continue;
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        passwordHash,
        emailVerified: true,
        deletedAt: null,
      },
    });
  }
}

async function seedDevelopmentTenant(): Promise<{
  readonly organizationCreated: boolean;
  readonly storeCreated: boolean;
  readonly membershipCreated: boolean;
}> {
  const existingOrganization = await prisma.organization.findUnique({
    where: { id: SEED_ORGANIZATION_ID },
  });

  if (!existingOrganization) {
    await prisma.organization.create({
      data: {
        id: SEED_ORGANIZATION_ID,
        name: "CommerceFlow Development",
        slug: SEED_ORGANIZATION_SLUG,
        settings: {},
      },
    });
  } else {
    await prisma.organization.update({
      where: { id: SEED_ORGANIZATION_ID },
      data: {
        name: "CommerceFlow Development",
        slug: SEED_ORGANIZATION_SLUG,
        deletedAt: null,
      },
    });
  }

  const existingStore = await prisma.store.findUnique({
    where: { id: SEED_STORE_ID },
  });

  if (!existingStore) {
    await prisma.store.create({
      data: {
        id: SEED_STORE_ID,
        organizationId: SEED_ORGANIZATION_ID,
        name: "CommerceFlow Dev Store",
        slug: SEED_STORE_SLUG,
        settings: {},
      },
    });
  } else {
    await prisma.store.update({
      where: { id: SEED_STORE_ID },
      data: {
        organizationId: SEED_ORGANIZATION_ID,
        name: "CommerceFlow Dev Store",
        slug: SEED_STORE_SLUG,
        deletedAt: null,
      },
    });
  }

  const adminUser = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL, deletedAt: null },
  });

  if (!adminUser) {
    throw new Error(`Expected seeded admin user ${ADMIN_EMAIL} to exist`);
  }

  // storeId+userId uniqueness is a partial index (active memberships only).
  const existingMembership = await prisma.storeMember.findFirst({
    where: {
      storeId: SEED_STORE_ID,
      userId: adminUser.id,
    },
  });

  if (!existingMembership) {
    await prisma.storeMember.create({
      data: {
        storeId: SEED_STORE_ID,
        userId: adminUser.id,
        role: "owner",
      },
    });
  } else {
    await prisma.storeMember.update({
      where: { id: existingMembership.id },
      data: {
        role: "owner",
        deletedAt: null,
      },
    });
  }

  return {
    organizationCreated: !existingOrganization,
    storeCreated: !existingStore,
    membershipCreated: !existingMembership,
  };
}

async function main(): Promise<void> {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  await seedIdentityUsers(passwordHash);
  const tenant = await seedDevelopmentTenant();

  console.log("CommerceFlow development seed complete.");
  console.log("");
  console.log("Tenant:");
  console.log(
    `  - Organization: CommerceFlow Development (${SEED_ORGANIZATION_ID}) [${tenant.organizationCreated ? "created" : "already existed"}]`,
  );
  console.log(
    `  - Store: CommerceFlow Dev Store (${SEED_STORE_ID}) [${tenant.storeCreated ? "created" : "already existed"}]`,
  );
  console.log(
    `  - Store membership: ${ADMIN_EMAIL} as owner [${tenant.membershipCreated ? "created" : "already existed"}]`,
  );
  console.log("");
  console.log("Development login (Admin Dashboard):");
  console.log(`  - Email:    ${ADMIN_EMAIL}`);
  console.log(`  - Password: ${SEED_PASSWORD}`);
  console.log(`  - Store ID: ${SEED_STORE_ID}`);
  console.log("");
  console.log("Other seeded identity accounts (same password):");
  for (const user of seedUsers) {
    console.log(`  - ${user.role}: ${user.email}`);
  }
  console.log("");
  console.log(
    "Set apps/admin/.env.local NEXT_PUBLIC_DEFAULT_STORE_ID to the Store ID above.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
