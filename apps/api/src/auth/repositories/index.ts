import { MemorySessionRepository } from "./memory-session.repository";
import { MemoryUserRepository } from "./memory-user.repository";
import type { SessionRepository } from "./session.repository";
import type { UserRepository } from "./user.repository";

const userRepository = new MemoryUserRepository();
const sessionRepository = new MemorySessionRepository();

export function getUserRepository(): UserRepository {
  return userRepository;
}

export function getSessionRepository(): SessionRepository {
  return sessionRepository;
}

export type { SessionRepository } from "./session.repository";
export type { UserRepository } from "./user.repository";
