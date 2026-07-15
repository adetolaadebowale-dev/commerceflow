import {
  buildCatalogueListResult,
  type Promotion,
} from "@commerceflow/types";
import type {
  CreatePromotionInput,
  ListPromotionsQuery,
  UpdatePromotionInput,
} from "@commerceflow/validation";

import type { PromotionRepository } from "./promotion.repository";

export class MemoryPromotionRepository implements PromotionRepository {
  private readonly promotionsById = new Map<string, Promotion>();
  private readonly deletedIds = new Set<string>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  getPromotionCount(): number {
    return this.promotionsById.size;
  }

  async findById(storeId: string, id: string): Promise<Promotion | null> {
    if (this.deletedIds.has(id)) {
      return null;
    }

    const promotion = this.promotionsById.get(id);
    return promotion?.storeId === storeId ? promotion : null;
  }

  async findActiveByCode(
    storeId: string,
    code: string,
    excludeId?: string,
  ): Promise<Promotion | null> {
    const normalizedCode = code.trim().toUpperCase();

    for (const promotion of this.promotionsById.values()) {
      if (
        promotion.storeId === storeId &&
        promotion.code === normalizedCode &&
        promotion.status === "active" &&
        !this.deletedIds.has(promotion.id) &&
        promotion.id !== excludeId
      ) {
        return promotion;
      }
    }

    return null;
  }

  async list(query: ListPromotionsQuery) {
    let items = [...this.promotionsById.values()].filter(
      (promotion) =>
        promotion.storeId === query.storeId &&
        !this.deletedIds.has(promotion.id),
    );

    if (query.status) {
      items = items.filter((promotion) => promotion.status === query.status);
    }

    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter(
        (promotion) =>
          promotion.name.toLowerCase().includes(search) ||
          promotion.code.toLowerCase().includes(search),
      );
    }

    items.sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        left.id.localeCompare(right.id),
    );

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const paged = items.slice(start, start + query.limit);

    return buildCatalogueListResult({
      items: paged,
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreatePromotionInput): Promise<Promotion> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    if (input.status === "active") {
      const existing = await this.findActiveByCode(input.storeId, input.code);
      if (existing) {
        throw new Error(`Promotion code already active: ${input.code}`);
      }
    }

    const now = new Date().toISOString();
    const promotion: Promotion = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      description: input.description?.trim(),
      type: input.type,
      value: input.value,
      currency: input.type === "fixed_amount" ? input.currency : undefined,
      status: input.status,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      createdAt: now,
      updatedAt: now,
    };

    this.promotionsById.set(promotion.id, promotion);
    return promotion;
  }

  async update(
    storeId: string,
    id: string,
    input: UpdatePromotionInput,
  ): Promise<Promotion> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Promotion not found: ${id}`);
    }

    const nextType = input.type ?? existing.type;
    const nextStatus = input.status ?? existing.status;
    const nextCode =
      input.code !== undefined
        ? input.code.trim().toUpperCase()
        : existing.code;

    if (nextStatus === "active") {
      const duplicate = await this.findActiveByCode(storeId, nextCode, id);
      if (duplicate) {
        throw new Error(`Promotion code already active: ${nextCode}`);
      }
    }

    const updated: Promotion = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.code !== undefined ? { code: nextCode } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() }
        : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.value !== undefined ? { value: input.value } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
      currency:
        nextType === "percentage"
          ? undefined
          : input.currency !== undefined
            ? input.currency
            : existing.currency,
      updatedAt: new Date().toISOString(),
    };

    this.promotionsById.set(id, updated);
    return updated;
  }

  async softDelete(storeId: string, id: string): Promise<Promotion> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Promotion not found: ${id}`);
    }

    this.deletedIds.add(id);
    return existing;
  }
}
