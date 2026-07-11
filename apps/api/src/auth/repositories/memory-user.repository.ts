import type { CreateUserInput, StoredUser } from "../types";
import type { UserRepository } from "./user.repository";

export class MemoryUserRepository implements UserRepository {
  private readonly usersById = new Map<string, StoredUser>();
  private readonly usersByEmail = new Map<string, StoredUser>();

  async findById(id: string): Promise<StoredUser | null> {
    return this.usersById.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<StoredUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return this.usersByEmail.get(normalizedEmail) ?? null;
  }

  async create(input: CreateUserInput): Promise<StoredUser> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const now = new Date().toISOString();

    const user: StoredUser = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      emailVerified: false,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      role: input.role ?? "customer",
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email, user);

    return user;
  }
}
