import { DiagnosticsLogService } from "../services/diagnostics-log.service";
import { LoggingService } from "../services/logging.service";
import { ObservabilityFacade } from "../services/observability.facade";
import { RequestCorrelationService } from "../services/request-correlation.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";

export function createMemoryObservabilityModule(options: {
  requestLoggingEnabled?: boolean;
  createId?: () => string;
} = {}) {
  let idCounter = 0;
  const createId =
    options.createId ??
    (() => {
      idCounter += 1;
      return `00000000-0000-4000-8000-${String(idCounter).padStart(12, "0")}`;
    });

  const requestCorrelationService = new RequestCorrelationService({
    createId,
  });
  const emitted: unknown[] = [];
  const loggingService = new LoggingService({
    requestCorrelationService,
    sink: (entry) => {
      emitted.push(JSON.parse(JSON.stringify(entry)));
    },
  });
  const diagnosticsLogService = new DiagnosticsLogService({
    loggingService,
    requestCorrelationService,
    requestLoggingEnabled: options.requestLoggingEnabled ?? true,
  });

  return {
    emitted,
    requestCorrelationService,
    loggingService,
    diagnosticsLogService,
    observabilityFacade: new ObservabilityFacade({
      loggingService,
      requestCorrelationService,
      diagnosticsLogService,
    }),
  };
}
