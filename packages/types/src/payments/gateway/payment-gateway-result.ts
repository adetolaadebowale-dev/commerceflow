/** Result returned by payment gateway operations. */
export interface PaymentGatewayOperationResult {
  readonly success: boolean;
  readonly gatewayReference?: string;
  readonly message?: string;
  readonly metadata?: Record<string, unknown>;
}
