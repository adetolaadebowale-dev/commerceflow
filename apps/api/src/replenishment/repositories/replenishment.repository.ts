import type {
  AcceptReplenishmentRecommendationResult,
  CatalogueListResult,
  ReplenishmentRecommendation,
  ReplenishmentRule,
} from "@commerceflow/types";
import type {
  AcceptReplenishmentRecommendationInput,
  CreateReplenishmentRuleInput,
  GenerateReplenishmentRecommendationsInput,
  ListReplenishmentRecommendationsQuery,
  ListReplenishmentRulesQuery,
  UpdateReplenishmentRuleInput,
} from "@commerceflow/validation";

export interface ReplenishmentRepository {
  findRuleById(storeId: string, id: string): Promise<ReplenishmentRule | null>;
  listRules(
    query: ListReplenishmentRulesQuery,
  ): Promise<CatalogueListResult<ReplenishmentRule>>;
  createRule(input: CreateReplenishmentRuleInput): Promise<ReplenishmentRule>;
  updateRule(
    storeId: string,
    id: string,
    input: UpdateReplenishmentRuleInput,
  ): Promise<ReplenishmentRule>;
  deleteRule(storeId: string, id: string): Promise<ReplenishmentRule>;
  findRecommendationById(
    storeId: string,
    id: string,
  ): Promise<ReplenishmentRecommendation | null>;
  listRecommendations(
    query: ListReplenishmentRecommendationsQuery,
  ): Promise<CatalogueListResult<ReplenishmentRecommendation>>;
  generateRecommendations(
    input: GenerateReplenishmentRecommendationsInput,
  ): Promise<ReplenishmentRecommendation[]>;
  acceptRecommendation(
    storeId: string,
    id: string,
    input: AcceptReplenishmentRecommendationInput,
    purchaseOrderNumber: string,
  ): Promise<AcceptReplenishmentRecommendationResult>;
  dismissRecommendation(
    storeId: string,
    id: string,
  ): Promise<ReplenishmentRecommendation>;
}
