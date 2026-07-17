import {
  type PrismaClient,
  type StoreMember as PrismaStoreMember,
} from "@prisma/client";
import type { StoreMember } from "@commerceflow/types";

import type { StoreMemberRepository } from "./store-member.repository";

function toStoreMember(record: PrismaStoreMember): StoreMember {
  return {
    id: record.id,
    storeId: record.storeId,
    userId: record.userId,
    role: record.role,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaStoreMemberRepository implements StoreMemberRepository {
  constructor(private readonly db: PrismaClient) {}

  async findActiveMembership(storeId: string, userId: string) {
    const record = await this.db.storeMember.findFirst({
      where: {
        storeId,
        userId,
        deletedAt: null,
        store: { deletedAt: null },
      },
    });

    return record ? toStoreMember(record) : null;
  }

  async findActiveMembershipsForOrganization(
    organizationId: string,
    userId: string,
  ): Promise<readonly StoreMember[]> {
    const records = await this.db.storeMember.findMany({
      where: {
        userId,
        deletedAt: null,
        store: {
          organizationId,
          deletedAt: null,
        },
      },
      orderBy: [{ createdAt: "asc" }],
    });

    return records.map(toStoreMember);
  }
}
