import type { StoreMember, StoreRole } from "@commerceflow/types";

import type { StoreMemberRepository } from "./store-member.repository";

interface SeededStoreMember extends StoreMember {}

export class MemoryStoreMemberRepository implements StoreMemberRepository {
  private readonly membersById = new Map<string, SeededStoreMember>();
  private readonly storeOrganizationIds = new Map<string, string>();

  seedMember(input: {
    storeId: string;
    userId: string;
    role: StoreRole;
    id?: string;
    organizationId?: string;
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

    if (input.organizationId) {
      this.storeOrganizationIds.set(input.storeId, input.organizationId);
    }

    return member;
  }

  getAll(): readonly StoreMember[] {
    return [...this.membersById.values()];
  }

  async findActiveMembership(storeId: string, userId: string) {
    for (const member of this.membersById.values()) {
      if (member.storeId === storeId && member.userId === userId) {
        return member;
      }
    }

    return null;
  }

  async findActiveMembershipsForOrganization(
    organizationId: string,
    userId: string,
  ): Promise<readonly StoreMember[]> {
    return [...this.membersById.values()].filter(
      (member) =>
        member.userId === userId &&
        this.storeOrganizationIds.get(member.storeId) === organizationId,
    );
  }
}
