import type { PrismaClient, User as PrismaUser } from "@prisma/client";

import type { CreateUserInput, StoredUser } from "../types";
import type { UserRepository } from "./user.repository";

function toStoredUser(record: PrismaUser): StoredUser {
  return {
    id: record.id,
    email: record.email,
    emailVerified: record.emailVerified,
    firstName: record.firstName,
    lastName: record.lastName,
    role: record.role,
    passwordHash: record.passwordHash,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<StoredUser | null> {
    const record = await this.db.user.findFirst({
      where: { id, deletedAt: null },
    });
    return record ? toStoredUser(record) : null;
  }

  async findByEmail(email: string): Promise<StoredUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const record = await this.db.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });

    return record ? toStoredUser(record) : null;
  }

  async create(input: CreateUserInput): Promise<StoredUser> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const record = await this.db.user.create({
      data: {
        email: normalizedEmail,
        emailVerified: false,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        role: input.role ?? "customer",
        passwordHash: input.passwordHash,
      },
    });

    return toStoredUser(record);
  }
}
