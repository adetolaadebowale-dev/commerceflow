import type {
  PaymentGateway,
  PaymentGatewayInitializeRequest,
  PaymentGatewayOperationResult,
  PaymentGatewayPaymentContext,
  PaymentProvider,
} from "@commerceflow/types";

const SIMULATE_FAILURE_KEY = "simulateGatewayFailure";

function buildSuccessResult(
  operation: string,
  reference: string,
): PaymentGatewayOperationResult {
  return {
    success: true,
    gatewayReference: `INT-${operation.toUpperCase()}-${reference}`,
    message: `Internal gateway ${operation} simulated successfully`,
    metadata: {
      simulated: true,
      operation,
    },
  };
}

function shouldSimulateFailure(
  metadata?: Record<string, unknown>,
): boolean {
  return metadata?.[SIMULATE_FAILURE_KEY] === true;
}

function buildFailureResult(operation: string): PaymentGatewayOperationResult {
  return {
    success: false,
    message: `Internal gateway ${operation} simulated failure`,
    metadata: {
      simulated: true,
      operation,
    },
  };
}

/**
 * Development-only gateway adapter that simulates successful provider
 * interactions without outbound HTTP or real money movement.
 */
export class InternalPaymentGateway implements PaymentGateway {
  readonly provider: PaymentProvider;

  constructor(provider: PaymentProvider = "internal") {
    this.provider = provider;
  }

  async initializePayment(
    request: PaymentGatewayInitializeRequest,
  ): Promise<PaymentGatewayOperationResult> {
    if (shouldSimulateFailure(request.metadata)) {
      return buildFailureResult("initialize");
    }

    return buildSuccessResult("initialize", request.reference);
  }

  async authorizePayment(
    context: PaymentGatewayPaymentContext,
  ): Promise<PaymentGatewayOperationResult> {
    if (shouldSimulateFailure(context.metadata)) {
      return buildFailureResult("authorize");
    }

    return buildSuccessResult("authorize", context.reference);
  }

  async capturePayment(
    context: PaymentGatewayPaymentContext,
  ): Promise<PaymentGatewayOperationResult> {
    if (shouldSimulateFailure(context.metadata)) {
      return buildFailureResult("capture");
    }

    return buildSuccessResult("capture", context.reference);
  }

  async cancelPayment(
    context: PaymentGatewayPaymentContext,
  ): Promise<PaymentGatewayOperationResult> {
    if (shouldSimulateFailure(context.metadata)) {
      return buildFailureResult("cancel");
    }

    return buildSuccessResult("cancel", context.reference);
  }

  async verifyPayment(
    context: PaymentGatewayPaymentContext,
  ): Promise<PaymentGatewayOperationResult> {
    if (shouldSimulateFailure(context.metadata)) {
      return buildFailureResult("verify");
    }

    return {
      success: context.status === "paid" || context.status === "authorized",
      gatewayReference: `INT-VERIFY-${context.reference}`,
      message: `Internal gateway verify simulated for status ${context.status}`,
      metadata: {
        simulated: true,
        operation: "verify",
        verifiedStatus: context.status,
      },
    };
  }
}
