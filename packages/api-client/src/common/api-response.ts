/**
 * Standard success envelope for CommerceFlow API responses.
 */
export interface ApiSuccessResponse<T> {
  readonly data: T;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/**
 * Standard error envelope for CommerceFlow API responses.
 */
export interface ApiErrorResponse {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
