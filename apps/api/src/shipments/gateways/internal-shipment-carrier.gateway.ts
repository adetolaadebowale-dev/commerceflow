import type {
  ShipmentCarrierGateway,
  ShipmentDispatchContext,
  ShipmentGatewayResult,
  ShipmentInitializeRequest,
} from "@commerceflow/types";

const SIMULATE_FAILURE_KEY = "simulateCarrierFailure";

function shouldSimulateFailure(
  metadata?: Record<string, unknown>,
): boolean {
  return metadata?.[SIMULATE_FAILURE_KEY] === true;
}

function buildSuccessResult(
  operation: string,
  reference: string,
  trackingNumber?: string,
): ShipmentGatewayResult {
  return {
    success: true,
    gatewayReference: `INT-${operation.toUpperCase()}-${reference}`,
    trackingNumber,
    message: `Internal carrier ${operation} simulated successfully`,
    metadata: {
      simulated: true,
      operation,
    },
  };
}

function buildFailureResult(operation: string): ShipmentGatewayResult {
  return {
    success: false,
    message: `Internal carrier ${operation} simulated failure`,
    metadata: {
      simulated: true,
      operation,
    },
  };
}

function generateSyntheticTrackingNumber(): string {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `INT-TRK-${suffix}`;
}

/**
 * Development-only carrier adapter that simulates successful provider
 * interactions without outbound HTTP or real carrier integrations.
 */
export class InternalShipmentCarrierGateway implements ShipmentCarrierGateway {
  readonly carrier = "internal" as const;

  async initializeShipment(
    request: ShipmentInitializeRequest,
  ): Promise<ShipmentGatewayResult> {
    if (shouldSimulateFailure(request.metadata)) {
      return buildFailureResult("initialize");
    }

    return buildSuccessResult("initialize", request.shipmentNumber);
  }

  async dispatchShipment(
    context: ShipmentDispatchContext,
  ): Promise<ShipmentGatewayResult> {
    if (shouldSimulateFailure(context.metadata)) {
      return buildFailureResult("dispatch");
    }

    const trackingNumber =
      context.trackingNumber ?? generateSyntheticTrackingNumber();

    return buildSuccessResult(
      "dispatch",
      context.shipmentNumber,
      trackingNumber,
    );
  }

  async verifyShipment(
    context: ShipmentDispatchContext,
  ): Promise<ShipmentGatewayResult> {
    if (shouldSimulateFailure(context.metadata)) {
      return buildFailureResult("verify");
    }

    return {
      success: context.status === "shipped" || context.status === "delivered",
      gatewayReference: `INT-VERIFY-${context.shipmentNumber}`,
      trackingNumber: context.trackingNumber,
      message: `Internal carrier verify simulated for status ${context.status}`,
      metadata: {
        simulated: true,
        operation: "verify",
        verifiedStatus: context.status,
      },
    };
  }

  async cancelShipment(
    context: ShipmentDispatchContext,
  ): Promise<ShipmentGatewayResult> {
    if (shouldSimulateFailure(context.metadata)) {
      return buildFailureResult("cancel");
    }

    return buildSuccessResult("cancel", context.shipmentNumber);
  }
}
