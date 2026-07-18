export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

export interface ApiSuccessEnvelope<T> {
  readonly data: T;
}

export interface ApiErrorEnvelope {
  readonly error: ApiErrorBody;
}

export class AdminApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}
