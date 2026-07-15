import { Prisma } from "@prisma/client";
import type { Promotion } from "@commerceflow/types";
import type {
  CreatePromotionInput,
  ListPromotionsQuery,
  UpdatePromotionInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { PROMOTION_ERROR_CODES, PromotionError } from "../errors";
import {
  getPromotionRepository,
  type PromotionRepository,
} from "../repositories";

export interface PromotionServiceDependencies {
  readonly promotionRepository?: PromotionRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class PromotionService {
  private readonly promotionRepository: PromotionRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: PromotionServiceDependencies = {}) {
    this.promotionRepository =
      dependencies.promotionRepository ?? getPromotionRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createPromotion(input: CreatePromotionInput): Promise<Promotion> {
    this.assertPromotionRules(input);

    if (input.status === "active") {
      await this.assertUniqueActiveCode(input.storeId, input.code);
    }

    try {
      const promotion = await this.promotionRepository.create(input);
      this.domainEventPublisher.publishPromotionCreated(promotion);
      return promotion;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async updatePromotion(
    storeId: string,
    id: string,
    input: UpdatePromotionInput,
  ): Promise<Promotion> {
    const existing = await this.requirePromotion(storeId, id);
    const effective = this.mergePromotionInput(existing, input);

    this.assertPromotionRules(effective);

    if (effective.status === "active") {
      await this.assertUniqueActiveCode(storeId, effective.code, id);
    }

    try {
      const promotion = await this.promotionRepository.update(
        storeId,
        id,
        input,
      );
      this.domainEventPublisher.publishPromotionUpdated(promotion);
      return promotion;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async getPromotion(storeId: string, id: string): Promise<Promotion> {
    const promotion = await this.promotionRepository.findById(storeId, id);

    if (!promotion) {
      throw new PromotionError(
        PROMOTION_ERROR_CODES.NOT_FOUND,
        "Promotion not found",
        404,
      );
    }

    return promotion;
  }

  async listPromotions(query: ListPromotionsQuery) {
    return this.promotionRepository.list(query);
  }

  async softDeletePromotion(storeId: string, id: string): Promise<Promotion> {
    await this.requirePromotion(storeId, id);

    try {
      const promotion = await this.promotionRepository.softDelete(storeId, id);
      this.domainEventPublisher.publishPromotionDeleted(promotion);
      return promotion;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private mergePromotionInput(
    existing: Promotion,
    input: UpdatePromotionInput,
  ): CreatePromotionInput {
    const type = input.type ?? existing.type;

    return {
      storeId: existing.storeId,
      name: input.name ?? existing.name,
      code: input.code ?? existing.code,
      description: input.description ?? existing.description,
      type,
      value: input.value ?? existing.value,
      currency:
        type === "percentage"
          ? undefined
          : input.currency ?? existing.currency,
      status: input.status ?? existing.status,
      startsAt: input.startsAt ?? existing.startsAt,
      endsAt: input.endsAt ?? existing.endsAt,
    };
  }

  private assertPromotionRules(input: {
    type: Promotion["type"];
    value: string;
    currency?: string;
    startsAt: string;
    endsAt: string;
  }): void {
    const numericValue = Number.parseFloat(input.value);

    if (input.type === "percentage") {
      if (numericValue <= 0 || numericValue > 100) {
        throw new PromotionError(
          PROMOTION_ERROR_CODES.VALIDATION_ERROR,
          "Percentage value must be greater than 0 and at most 100",
          400,
        );
      }

      if (input.currency) {
        throw new PromotionError(
          PROMOTION_ERROR_CODES.VALIDATION_ERROR,
          "Currency must not be set for percentage promotions",
          400,
        );
      }
    } else if (numericValue <= 0) {
      throw new PromotionError(
        PROMOTION_ERROR_CODES.VALIDATION_ERROR,
        "Fixed amount value must be greater than 0",
        400,
      );
    } else if (!input.currency) {
      throw new PromotionError(
        PROMOTION_ERROR_CODES.VALIDATION_ERROR,
        "Currency is required for fixed amount promotions",
        400,
      );
    }

    if (new Date(input.startsAt).getTime() >= new Date(input.endsAt).getTime()) {
      throw new PromotionError(
        PROMOTION_ERROR_CODES.VALIDATION_ERROR,
        "startsAt must be before endsAt",
        400,
      );
    }
  }

  private async assertUniqueActiveCode(
    storeId: string,
    code: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.promotionRepository.findActiveByCode(
      storeId,
      code,
      excludeId,
    );

    if (existing) {
      throw new PromotionError(
        PROMOTION_ERROR_CODES.CODE_ALREADY_EXISTS,
        "An active promotion with this code already exists",
        409,
      );
    }
  }

  private async requirePromotion(
    storeId: string,
    id: string,
  ): Promise<Promotion> {
    const promotion = await this.promotionRepository.findById(storeId, id);

    if (!promotion) {
      throw new PromotionError(
        PROMOTION_ERROR_CODES.NOT_FOUND,
        "Promotion not found",
        404,
      );
    }

    return promotion;
  }

  private mapRepositoryError(error: unknown): PromotionError {
    if (error instanceof Error && error.message.startsWith("Promotion not found:")) {
      return new PromotionError(
        PROMOTION_ERROR_CODES.NOT_FOUND,
        "Promotion not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Promotion code already active:")
    ) {
      return new PromotionError(
        PROMOTION_ERROR_CODES.CODE_ALREADY_EXISTS,
        "An active promotion with this code already exists",
        409,
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return new PromotionError(
        PROMOTION_ERROR_CODES.CODE_ALREADY_EXISTS,
        "An active promotion with this code already exists",
        409,
      );
    }

    if (error instanceof PromotionError) {
      return error;
    }

    return new PromotionError(
      PROMOTION_ERROR_CODES.TRANSACTION_FAILED,
      "Promotion transaction failed",
      500,
    );
  }
}

export const promotionService = new PromotionService();
