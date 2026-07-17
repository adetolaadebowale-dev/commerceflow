import { describe, expect, it } from "vitest";

import { CORRELATION_ID_HEADER } from "../services/request-correlation.service";
import { createMemoryObservabilityModule } from "../testing/observability-test-utils";

describe("ObservabilityFacade", () => {
  it("generates and propagates correlation IDs", () => {
    const module = createMemoryObservabilityModule();

    const context = module.observabilityFacade.createCorrelationContext({
      method: "GET",
      path: "/api/platform/logging",
    });

    expect(context.correlationId).toMatch(
      /^00000000-0000-4000-8000-00000000000\d$/,
    );
    expect(context.requestId).not.toBe(context.correlationId);
    expect(
      module.requestCorrelationService.getContext(context.requestId),
    ).toEqual(context);

    const headers = new Headers({
      [CORRELATION_ID_HEADER]: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });
    const fromHeaders =
      module.requestCorrelationService.createContextFromHeaders(headers, {
        method: "POST",
        path: "/api/orders",
      });

    expect(fromHeaders.correlationId).toBe(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
  });

  it("writes structured JSON logs with correlation metadata", () => {
    const module = createMemoryObservabilityModule();
    const context = module.observabilityFacade.createCorrelationContext({
      method: "GET",
      path: "/api/products",
      storeId: "11111111-1111-1111-1111-111111111111",
    });

    module.observabilityFacade.logRequest(context);
    module.observabilityFacade.logError(
      "handler.failed",
      new Error("boom"),
      { code: "TEST_ERROR" },
    );
    module.observabilityFacade.logResponse(context, 500, 12);

    expect(module.emitted).toHaveLength(3);
    expect(module.emitted[0]).toEqual(
      expect.objectContaining({
        level: "info",
        message: "request.started",
        correlationId: context.correlationId,
        requestId: context.requestId,
        metadata: expect.objectContaining({
          method: "GET",
          path: "/api/products",
        }),
      }),
    );
    expect(module.emitted[1]).toEqual(
      expect.objectContaining({
        level: "error",
        message: "handler.failed",
        correlationId: context.correlationId,
        error: expect.objectContaining({
          name: "Error",
          message: "boom",
        }),
        metadata: { code: "TEST_ERROR" },
      }),
    );
    expect(module.emitted[2]).toEqual(
      expect.objectContaining({
        message: "request.completed",
        metadata: expect.objectContaining({
          status: 500,
          durationMs: 12,
        }),
      }),
    );
    expect(
      module.requestCorrelationService.getContext(context.requestId),
    ).toBeNull();
  });

  it("returns logging summary and diagnostics", () => {
    const module = createMemoryObservabilityModule();
    const context = module.observabilityFacade.createCorrelationContext();
    module.observabilityFacade.logRequest(context);
    module.observabilityFacade.logResponse(context, 200, 5);

    const logging = module.observabilityFacade.getLoggingSummary();
    expect(logging.totalEntries).toBe(2);
    expect(logging.byLevel.info).toBe(2);
    expect(logging.recentEntries[0]?.message).toBe("request.completed");

    const diagnostics = module.observabilityFacade.getDiagnostics();
    expect(diagnostics.status).toBe("healthy");
    expect(diagnostics.requestLoggingEnabled).toBe(true);
    expect(diagnostics.lastCorrelationId).toBe(context.correlationId);
  });

  it("marks diagnostics degraded when request logging is disabled", () => {
    const module = createMemoryObservabilityModule({
      requestLoggingEnabled: false,
    });

    expect(module.observabilityFacade.getDiagnostics().status).toBe("degraded");
  });
});
