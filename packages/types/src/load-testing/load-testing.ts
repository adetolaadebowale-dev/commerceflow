/** Load testing tool preference (configuration only; not executed). */
export const LOAD_TEST_TOOLS = ["manual", "k6", "jmeter", "gatling"] as const;

export type LoadTestTool = (typeof LOAD_TEST_TOOLS)[number];

export const SCALABILITY_ASSESSMENT_STATUSES = [
  "adequate",
  "needs_attention",
  "at_risk",
] as const;

export type ScalabilityAssessmentStatus =
  (typeof SCALABILITY_ASSESSMENT_STATUSES)[number];

export const CAPACITY_RECOMMENDATION_SEVERITIES = [
  "info",
  "warn",
  "critical",
] as const;

export type CapacityRecommendationSeverity =
  (typeof CAPACITY_RECOMMENDATION_SEVERITIES)[number];

/** Declared load testing configuration. */
export interface LoadTestingConfiguration {
  readonly enabled: boolean;
  readonly preferredTool: LoadTestTool;
  readonly targetVirtualUsers: number;
  readonly durationSeconds: number;
  readonly rampUpSeconds: number;
  readonly notes?: string;
  readonly updatedAt: string;
}

/** Endpoint performance baseline inventory entry. */
export interface EndpointPerformanceBaseline {
  readonly endpointKey: string;
  readonly method: string;
  readonly path: string;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly maxRps: number;
  readonly notes?: string;
}

export interface PerformanceBaseline {
  readonly endpoints: readonly EndpointPerformanceBaseline[];
  readonly recordedAt: string;
}

export interface CapacityPlanningRecommendation {
  readonly code: string;
  readonly severity: CapacityRecommendationSeverity;
  readonly message: string;
  readonly relatedEndpointKey?: string;
}

export interface ScalabilityAssessment {
  readonly status: ScalabilityAssessmentStatus;
  readonly configuration: LoadTestingConfiguration;
  readonly baselines: PerformanceBaseline;
  readonly recommendations: readonly CapacityPlanningRecommendation[];
  readonly checkedAt: string;
}

export interface LoadTestingSummary {
  readonly configuration: LoadTestingConfiguration;
  readonly baselines: PerformanceBaseline;
  readonly assessment: ScalabilityAssessment;
  readonly checkedAt: string;
}
