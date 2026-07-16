import type { CustomerAddress } from "@commerceflow/types";
import type { UpdateCustomerAddressInput } from "@commerceflow/validation";

import type {
  CreateCustomerAddressRecordInput,
  CustomerAddressRepository,
} from "./customer-address.repository";

export class MemoryCustomerAddressRepository implements CustomerAddressRepository {
  private readonly addressesById = new Map<string, CustomerAddress>();
  private readonly deletedIds = new Set<string>();

  async findById(storeId: string, id: string): Promise<CustomerAddress | null> {
    if (this.deletedIds.has(id)) {
      return null;
    }

    const address = this.addressesById.get(id);
    return address?.storeId === storeId ? address : null;
  }

  async listByCustomerId(storeId: string, customerId: string) {
    return [...this.addressesById.values()]
      .filter(
        (address) =>
          address.storeId === storeId &&
          address.customerId === customerId &&
          !this.deletedIds.has(address.id),
      )
      .sort((left, right) => {
        if (left.isDefault !== right.isDefault) {
          return left.isDefault ? -1 : 1;
        }

        return left.createdAt.localeCompare(right.createdAt);
      });
  }

  async countActiveByCustomerId(storeId: string, customerId: string) {
    const addresses = await this.listByCustomerId(storeId, customerId);
    return addresses.length;
  }

  async create(input: CreateCustomerAddressRecordInput): Promise<CustomerAddress> {
    const activeCount = await this.countActiveByCustomerId(
      input.storeId,
      input.customerId,
    );
    const shouldBeDefault = input.isDefault || activeCount === 0;

    if (shouldBeDefault) {
      await this.clearDefault(input.storeId, input.customerId);
    }

    const now = new Date().toISOString();
    const address: CustomerAddress = {
      id: crypto.randomUUID(),
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
      isDefault: shouldBeDefault,
      createdAt: now,
      updatedAt: now,
    };

    this.addressesById.set(address.id, address);
    return address;
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

    if (input.isDefault === true) {
      await this.clearDefault(storeId, existing.customerId, id);
    }

    const updated: CustomerAddress = {
      ...existing,
      ...(input.label !== undefined ? { label: input.label.trim() } : {}),
      ...(input.recipientName !== undefined
        ? { recipientName: input.recipientName.trim() }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() } : {}),
      ...(input.addressLine1 !== undefined
        ? { addressLine1: input.addressLine1.trim() }
        : {}),
      ...(input.addressLine2 !== undefined
        ? { addressLine2: input.addressLine2?.trim() }
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
      updatedAt: new Date().toISOString(),
    };

    this.addressesById.set(id, updated);
    return updated;
  }

  async softDelete(storeId: string, id: string): Promise<CustomerAddress> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`CustomerAddress not found: ${id}`);
    }

    this.deletedIds.add(id);

    if (existing.isDefault) {
      const replacement = (await this.listByCustomerId(
        storeId,
        existing.customerId,
      ))[0];

      if (replacement) {
        this.addressesById.set(replacement.id, {
          ...replacement,
          isDefault: true,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return existing;
  }

  seedCustomerAddress(address: CustomerAddress): void {
    this.addressesById.set(address.id, address);
  }

  private async clearDefault(
    storeId: string,
    customerId: string,
    exceptId?: string,
  ) {
    for (const address of this.addressesById.values()) {
      if (
        address.storeId === storeId &&
        address.customerId === customerId &&
        !this.deletedIds.has(address.id) &&
        address.isDefault &&
        address.id !== exceptId
      ) {
        this.addressesById.set(address.id, {
          ...address,
          isDefault: false,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
}
