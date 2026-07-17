import type { CorrelationContext } from "@commerceflow/types";

export const CORRELATION_ID_HEADER = "x-correlation-id";
export const REQUEST_ID_HEADER = "x-request-id";

export interface RequestCorrelationServiceDependencies {
  readonly now?: () => Date;
  readonly createId?: () => string;
}

export class RequestCorrelationService {
  private readonly contextsByRequestId = new Map<string, CorrelationContext>();
  private lastCorrelationId: string | undefined;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: RequestCorrelationServiceDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? (() => crypto.randomUUID());
  }

  createContext(input: {
    readonly method?: string;
    readonly path?: string;
    readonly storeId?: string;
    readonly userId?: string;
    readonly correlationId?: string;
    readonly requestId?: string;
  } = {}): CorrelationContext {
    const correlationId = input.correlationId?.trim() || this.createId();
    const requestId = input.requestId?.trim() || this.createId();
    const context: CorrelationContext = {
      correlationId,
      requestId,
      method: input.method,
      path: input.path,
      storeId: input.storeId,
      userId: input.userId,
      startedAt: this.now().toISOString(),
    };

    this.contextsByRequestId.set(requestId, context);
    this.lastCorrelationId = correlationId;
    return context;
  }

  createContextFromHeaders(
    headers: Headers,
    input: {
      readonly method?: string;
      readonly path?: string;
      readonly storeId?: string;
      readonly userId?: string;
    } = {},
  ): CorrelationContext {
    return this.createContext({
      ...input,
      correlationId: headers.get(CORRELATION_ID_HEADER) ?? undefined,
      requestId: headers.get(REQUEST_ID_HEADER) ?? undefined,
    });
  }

  getContext(requestId: string): CorrelationContext | null {
    return this.contextsByRequestId.get(requestId) ?? null;
  }

  clearContext(requestId: string): void {
    this.contextsByRequestId.delete(requestId);
  }

  getActiveContextCount(): number {
    return this.contextsByRequestId.size;
  }

  getLastCorrelationId(): string | undefined {
    return this.lastCorrelationId;
  }

  generateCorrelationId(): string {
    return this.createId();
  }
}

export const requestCorrelationService = new RequestCorrelationService();
