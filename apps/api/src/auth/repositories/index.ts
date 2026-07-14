import { PrismaSessionRepository } from "./prisma-session.repository";
import { PrismaUserRepository } from "./prisma-user.repository";
import type { SessionRepository } from "./session.repository";
import type { UserRepository } from "./user.repository";
import { prisma } from "@/lib/prisma";

const userRepository: UserRepository = new PrismaUserRepository(prisma);
const sessionRepository: SessionRepository = new PrismaSessionRepository(prisma);

export function getUserRepository(): UserRepository {
  return userRepository;
}

export function getSessionRepository(): SessionRepository {
  return sessionRepository;
}

export type { SessionRepository } from "./session.repository";
export type { UserRepository } from "./user.repository";
