import type {
  SecurityCheck,
  SecurityDiagnosticStatus,
  SecurityDiagnostics,
} from "@commerceflow/types";

import {
  RateLimitService,
  rateLimitService,
} from "./rate-limit.service";

export interface SecurityReviewServiceDependencies {
  readonly rateLimitService?: RateLimitService;
  readonly env?: NodeJS.ProcessEnv;
  readonly environment?: string;
}

export class SecurityReviewService {
  private readonly rateLimitService: RateLimitService;
  private readonly env: NodeJS.ProcessEnv;
  private readonly environment: string;

  constructor(dependencies: SecurityReviewServiceDependencies = {}) {
    this.rateLimitService =
      dependencies.rateLimitService ?? rateLimitService;
    this.env = dependencies.env ?? process.env;
    this.environment =
      dependencies.environment ??
      dependencies.env?.NODE_ENV ??
      process.env.NODE_ENV ??
      "development";
  }

  getSecurityDiagnostics(): SecurityDiagnostics {
    const checks: SecurityCheck[] = [
      this.checkSecret("JWT_ACCESS_SECRET"),
      this.checkSecret("JWT_REFRESH_SECRET"),
      this.checkDatabaseUrl(),
      this.checkProductionHttpsHint(),
      this.checkRateLimitsEnabled(),
    ];

    return {
      status: this.deriveStatus(checks),
      checks,
      checkedAt: new Date().toISOString(),
    };
  }

  private checkSecret(key: string): SecurityCheck {
    const value = this.env[key];

    if (!value || value.trim().length === 0) {
      if (this.environment === "test") {
        return {
          name: key,
          status: "warn",
          message: `${key} is unset (acceptable in test)`,
        };
      }

      return {
        name: key,
        status: "fail",
        message: `${key} is not configured`,
      };
    }

    if (value.length < 16) {
      return {
        name: key,
        status: "warn",
        message: `${key} is shorter than recommended`,
      };
    }

    return {
      name: key,
      status: "pass",
      message: `${key} is configured`,
    };
  }

  private checkDatabaseUrl(): SecurityCheck {
    const value = this.env.DATABASE_URL;

    if (!value || value.trim().length === 0) {
      return {
        name: "DATABASE_URL",
        status: this.environment === "test" ? "warn" : "fail",
        message: "DATABASE_URL is not configured",
      };
    }

    if (
      this.environment === "production" &&
      value.includes("sslmode=disable")
    ) {
      return {
        name: "DATABASE_URL",
        status: "warn",
        message: "DATABASE_URL disables SSL in production",
      };
    }

    return {
      name: "DATABASE_URL",
      status: "pass",
      message: "DATABASE_URL is configured",
    };
  }

  private checkProductionHttpsHint(): SecurityCheck {
    if (this.environment !== "production") {
      return {
        name: "transport",
        status: "pass",
        message: "Non-production environment",
      };
    }

    const publicUrl = this.env.PUBLIC_API_URL ?? this.env.APP_URL;

    if (publicUrl && publicUrl.startsWith("https://")) {
      return {
        name: "transport",
        status: "pass",
        message: "Public URL uses HTTPS",
      };
    }

    return {
      name: "transport",
      status: "warn",
      message: "Public HTTPS URL is not configured",
    };
  }

  private checkRateLimitsEnabled(): SecurityCheck {
    const enabled = this.rateLimitService
      .listPolicies()
      .filter((policy) => policy.enabled).length;

    if (enabled === 0) {
      return {
        name: "rate_limits",
        status: "warn",
        message: "No rate limit policies are enabled",
      };
    }

    return {
      name: "rate_limits",
      status: "pass",
      message: `${enabled} rate limit policies enabled`,
    };
  }

  private deriveStatus(
    checks: readonly SecurityCheck[],
  ): SecurityDiagnosticStatus {
    if (checks.some((check) => check.status === "fail")) {
      return "at_risk";
    }

    if (checks.some((check) => check.status === "warn")) {
      return "needs_attention";
    }

    return "secure";
  }
}

export const securityReviewService = new SecurityReviewService();
