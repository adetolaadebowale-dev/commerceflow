import type { StoreMember, StoreRole } from "@commerceflow/types";

import type { StoreMemberRepository } from "./store-member.repository";

interface SeededStoreMember extends StoreMember {}

export class MemoryStoreMemberRepository implements StoreMemberRepository {
  private readonly membersById = new Map<string, SeededStoreMember>();

  seedMember(input: {
    storeId: string;
    userId: string;
    role: StoreRole;
    id?: string;
  }): StoreMember {
    const now = new Date().toISOString();
    const member: StoreMember = {
      id: input.id ?? crypto.randomUUID(),
      storeId: input.storeId,
      userId: input.userId,
      role: input.role,
      createdAt: now,
      updatedAt: now,
    };

    this.membersById.set(member.id, member);
    return member;
  }

  async findActiveMembership(storeId: string, userId: string) {
    for (const member of this.membersById.values()) {
      if (member.storeId === storeId && member.userId === userId) {
        return member;
      }
    }

    return null;
  }
}
