import { MemorySessionRepository } from "./memory-session.repository";
import { MemoryUserRepository } from "./memory-user.repository";
import { PrismaSessionRepository } from "./prisma-session.repository";
import { PrismaUserRepository } from "./prisma-user.repository";
import type { SessionRepository } from "./session.repository";
import type { UserRepository } from "./user.repository";
import { prisma } from "@/lib/prisma";

const useMemoryRepositories =
  process.env.VITEST === "true" || !process.env.DATABASE_URL;

const userRepository: UserRepository = useMemoryRepositories
  ? new MemoryUserRepository()
  : new PrismaUserRepository(prisma);

const sessionRepository: SessionRepository = useMemoryRepositories
  ? new MemorySessionRepository()
  : new PrismaSessionRepository(prisma);

export function getUserRepository(): UserRepository {
  return userRepository;
}

export function getSessionRepository(): SessionRepository {
  return sessionRepository;
}

export type { SessionRepository } from "./session.repository";
export type { UserRepository } from "./user.repository";
