import type { CreateSessionInput, StoredSession } from "../types";
import type { SessionRepository } from "./session.repository";

export class MemorySessionRepository implements SessionRepository {
  private readonly sessionsById = new Map<string, StoredSession>();

  async findById(id: string): Promise<StoredSession | null> {
    return this.sessionsById.get(id) ?? null;
  }

  async create(input: CreateSessionInput): Promise<StoredSession> {
    const now = new Date().toISOString();

    const session: StoredSession = {
      id: crypto.randomUUID(),
      userId: input.userId,
      expiresAt: input.expiresAt,
      createdAt: now,
      lastActiveAt: now,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      refreshTokenId: input.refreshTokenId,
      revoked: false,
    };

    this.sessionsById.set(session.id, session);
    return session;
  }

  async updateRefreshTokenId(
    id: string,
    refreshTokenId: string,
  ): Promise<StoredSession> {
    const session = this.sessionsById.get(id);

    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }

    const updated: StoredSession = {
      ...session,
      refreshTokenId,
      lastActiveAt: new Date().toISOString(),
    };

    this.sessionsById.set(id, updated);
    return updated;
  }

  async touch(id: string): Promise<StoredSession> {
    const session = this.sessionsById.get(id);

    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }

    const updated: StoredSession = {
      ...session,
      lastActiveAt: new Date().toISOString(),
    };

    this.sessionsById.set(id, updated);
    return updated;
  }

  async revoke(id: string): Promise<void> {
    const session = this.sessionsById.get(id);

    if (!session) {
      return;
    }

    this.sessionsById.set(id, { ...session, revoked: true });
  }
}
