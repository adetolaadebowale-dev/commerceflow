import {
  type CustomerAddress as PrismaCustomerAddress,
  type PrismaClient,
} from "@prisma/client";
import type { CustomerAddress } from "@commerceflow/types";
import type { UpdateCustomerAddressInput } from "@commerceflow/validation";

import type {
  CreateCustomerAddressRecordInput,
  CustomerAddressRepository,
} from "./customer-address.repository";

function toCustomerAddress(record: PrismaCustomerAddress): CustomerAddress {
  return {
    id: record.id,
    customerId: record.customerId,
    storeId: record.storeId,
    label: record.label,
    recipientName: record.recipientName,
    phone: record.phone ?? undefined,
    addressLine1: record.addressLine1,
    addressLine2: record.addressLine2 ?? undefined,
    city: record.city,
    stateProvince: record.stateProvince,
    postalCode: record.postalCode,
    countryCode: record.countryCode,
    isDefault: record.isDefault,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildCreateData(input: CreateCustomerAddressRecordInput) {
  return {
    customerId: input.customerId,
    storeId: input.storeId,
    label: input.label.trim(),
    recipientName: input.recipientName.trim(),
    phone: input.phone?.trim(),
    addressLine1: input.addressLine1.trim(),
    addressLine2: input.addressLine2?.trim(),
    city: input.city.trim(),
    stateProvince: input.stateProvince.trim(),
    postalCode: input.postalCode.trim(),
    countryCode: input.countryCode.trim().toUpperCase(),
    isDefault: input.isDefault,
  };
}

function buildUpdateData(input: UpdateCustomerAddressInput) {
  return {
    ...(input.label !== undefined ? { label: input.label.trim() } : {}),
    ...(input.recipientName !== undefined
      ? { recipientName: input.recipientName.trim() }
      : {}),
    ...(input.phone !== undefined ? { phone: input.phone?.trim() ?? null } : {}),
    ...(input.addressLine1 !== undefined
      ? { addressLine1: input.addressLine1.trim() }
      : {}),
    ...(input.addressLine2 !== undefined
      ? { addressLine2: input.addressLine2?.trim() ?? null }
      : {}),
    ...(input.city !== undefined ? { city: input.city.trim() } : {}),
    ...(input.stateProvince !== undefined
      ? { stateProvince: input.stateProvince.trim() }
      : {}),
    ...(input.postalCode !== undefined
      ? { postalCode: input.postalCode.trim() }
      : {}),
    ...(input.countryCode !== undefined
      ? { countryCode: input.countryCode.trim().toUpperCase() }
      : {}),
    ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
  };
}

export class PrismaCustomerAddressRepository implements CustomerAddressRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<CustomerAddress | null> {
    const record = await this.db.customerAddress.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    return record ? toCustomerAddress(record) : null;
  }

  async listByCustomerId(storeId: string, customerId: string) {
    const records = await this.db.customerAddress.findMany({
      where: { storeId, customerId, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return records.map(toCustomerAddress);
  }

  async countActiveByCustomerId(storeId: string, customerId: string) {
    return this.db.customerAddress.count({
      where: { storeId, customerId, deletedAt: null },
    });
  }

  async create(input: CreateCustomerAddressRecordInput): Promise<CustomerAddress> {
    const activeCount = await this.countActiveByCustomerId(
      input.storeId,
      input.customerId,
    );
    const shouldBeDefault = input.isDefault || activeCount === 0;

    return this.db.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.customerAddress.updateMany({
          where: {
            storeId: input.storeId,
            customerId: input.customerId,
            deletedAt: null,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      const record = await tx.customerAddress.create({
        data: {
          ...buildCreateData(input),
          isDefault: shouldBeDefault,
        },
      });

      return toCustomerAddress(record);
    });
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateCustomerAddressInput,
  ): Promise<CustomerAddress> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`CustomerAddress not found: ${id}`);
    }

    return this.db.$transaction(async (tx) => {
      if (input.isDefault === true) {
        await tx.customerAddress.updateMany({
          where: {
            storeId,
            customerId: existing.customerId,
            deletedAt: null,
            isDefault: true,
            NOT: { id },
          },
          data: { isDefault: false },
        });
      }

      const result = await tx.customerAddress.updateMany({
        where: { id, storeId, deletedAt: null },
        data: buildUpdateData(input),
      });

      if (result.count === 0) {
        throw new Error(`CustomerAddress not found: ${id}`);
      }

      const record = await tx.customerAddress.findFirstOrThrow({
        where: { id, storeId },
      });

      return toCustomerAddress(record);
    });
  }

  async softDelete(storeId: string, id: string): Promise<CustomerAddress> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`CustomerAddress not found: ${id}`);
    }

    return this.db.$transaction(async (tx) => {
      const result = await tx.customerAddress.updateMany({
        where: { id, storeId, deletedAt: null },
        data: { deletedAt: new Date(), isDefault: false },
      });

      if (result.count === 0) {
        throw new Error(`CustomerAddress not found: ${id}`);
      }

      if (existing.isDefault) {
        const replacement = await tx.customerAddress.findFirst({
          where: {
            storeId,
            customerId: existing.customerId,
            deletedAt: null,
            NOT: { id },
          },
          orderBy: { createdAt: "asc" },
        });

        if (replacement) {
          await tx.customerAddress.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }
      }

      const record = await tx.customerAddress.findFirstOrThrow({
        where: { id, storeId },
      });

      return toCustomerAddress(record);
    });
  }
}
