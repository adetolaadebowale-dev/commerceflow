import type {
  EndpointPerformanceBaseline,
  LoadTestingConfiguration,
} from "@commerceflow/types";
import type { UpdateLoadTestingConfigurationInput } from "@commerceflow/validation";

export function defaultLoadTestingConfiguration(
  now = new Date().toISOString(),
): LoadTestingConfiguration {
  return {
    enabled: false,
    preferredTool: "manual",
    targetVirtualUsers: 50,
    durationSeconds: 300,
    rampUpSeconds: 60,
    notes: "Load test execution is external to CommerceFlow",
    updatedAt: now,
  };
}

export const DEFAULT_ENDPOINT_BASELINES: readonly EndpointPerformanceBaseline[] =
  [
    {
      endpointKey: "catalogue.products.list",
      method: "GET",
      path: "/api/products",
      p50Ms: 40,
      p95Ms: 120,
      p99Ms: 220,
      maxRps: 80,
      notes: "Store-scoped product listing",
    },
    {
      endpointKey: "orders.create",
      method: "POST",
      path: "/api/orders",
      p50Ms: 90,
      p95Ms: 250,
      p99Ms: 400,
      maxRps: 25,
      notes: "Order creation path",
    },
    {
      endpointKey: "platform.health",
      method: "GET",
      path: "/api/platform/health",
      p50Ms: 15,
      p95Ms: 40,
      p99Ms: 80,
      maxRps: 200,
      notes: "Authenticated health summary",
    },
    {
      endpointKey: "auth.login",
      method: "POST",
      path: "/api/auth/login",
      p50Ms: 50,
      p95Ms: 150,
      p99Ms: 300,
      maxRps: 40,
      notes: "Credential exchange",
    },
  ];

export interface LoadTestingConfigurationRepository {
  getConfiguration(): Promise<LoadTestingConfiguration>;
  updateConfiguration(
    input: Omit<UpdateLoadTestingConfigurationInput, "storeId">,
  ): Promise<LoadTestingConfiguration>;
}
