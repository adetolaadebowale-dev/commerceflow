import type { CreateSessionInput, StoredSession } from "../types";

export interface SessionRepository {
  findById(id: string): Promise<StoredSession | null>;
  create(input: CreateSessionInput): Promise<StoredSession>;
  updateRefreshTokenId(id: string, refreshTokenId: string): Promise<StoredSession>;
  touch(id: string): Promise<StoredSession>;
  revoke(id: string): Promise<void>;
}
