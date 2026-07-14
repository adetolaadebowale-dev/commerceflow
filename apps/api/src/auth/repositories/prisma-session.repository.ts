import { Prisma, type PrismaClient, type Session as PrismaSession } from "@prisma/client";

import type { CreateSessionInput, StoredSession } from "../types";
import type { SessionRepository } from "./session.repository";

function toStoredSession(record: PrismaSession): StoredSession {
  return {
    id: record.id,
    userId: record.userId,
    expiresAt: record.expiresAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    lastActiveAt: record.lastActiveAt.toISOString(),
    ipAddress: record.ipAddress ?? undefined,
    userAgent: record.userAgent ?? undefined,
    refreshTokenId: record.refreshTokenId,
    revoked: record.revoked,
  };
}

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<StoredSession | null> {
    const record = await this.db.session.findUnique({ where: { id } });
    return record ? toStoredSession(record) : null;
  }

  async create(input: CreateSessionInput): Promise<StoredSession> {
    const now = new Date();

    const record = await this.db.session.create({
      data: {
        userId: input.userId,
        expiresAt: new Date(input.expiresAt),
        createdAt: now,
        lastActiveAt: now,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        refreshTokenId: input.refreshTokenId,
        revoked: false,
      },
    });

    return toStoredSession(record);
  }

  async updateRefreshTokenId(
    id: string,
    refreshTokenId: string,
  ): Promise<StoredSession> {
    try {
      const record = await this.db.session.update({
        where: { id },
        data: {
          refreshTokenId,
          lastActiveAt: new Date(),
        },
      });

      return toStoredSession(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new Error(`Session not found: ${id}`);
      }

      throw error;
    }
  }

  async touch(id: string): Promise<StoredSession> {
    try {
      const record = await this.db.session.update({
        where: { id },
        data: {
          lastActiveAt: new Date(),
        },
      });

      return toStoredSession(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new Error(`Session not found: ${id}`);
      }

      throw error;
    }
  }

  async revoke(id: string): Promise<void> {
    await this.db.session.updateMany({
      where: { id },
      data: { revoked: true },
    });
  }
}
