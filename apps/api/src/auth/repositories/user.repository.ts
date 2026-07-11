import type { CreateUserInput, StoredUser } from "../types";

export interface UserRepository {
  findById(id: string): Promise<StoredUser | null>;
  findByEmail(email: string): Promise<StoredUser | null>;
  create(input: CreateUserInput): Promise<StoredUser>;
}
