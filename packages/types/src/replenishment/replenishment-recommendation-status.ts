export const REPLENISHMENT_RECOMMENDATION_STATUSES = [
  "pending",
  "accepted",
  "dismissed",
] as const;

export type ReplenishmentRecommendationStatus =
  (typeof REPLENISHMENT_RECOMMENDATION_STATUSES)[number];
