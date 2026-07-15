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
    gatewayReference: `MAN-${operation.toUpperCase()}-${reference}`,
    trackingNumber,
    message: `Manual carrier ${operation} simulated successfully`,
    metadata: {
      simulated: true,
      operation,
    },
  };
}

function buildFailureResult(operation: string): ShipmentGatewayResult {
  return {
    success: false,
    message: `Manual carrier ${operation} simulated failure`,
    metadata: {
      simulated: true,
      operation,
    },
  };
}

/**
 * Manual carrier adapter that accepts operator-provided tracking numbers
 * and simulates successful dispatch without external integrations.
 */
export class ManualShipmentCarrierGateway implements ShipmentCarrierGateway {
  readonly carrier = "manual" as const;

  async initializeShipment(
    request: ShipmentInitializeRequest,
  ): Promise<ShipmentGatewayResult> {
    if (shouldSimulateFailure(request.metadata)) {
      return buildFailureResult("initialize");
    }

    return buildSuccessResult(
      "initialize",
      request.shipmentNumber,
      request.trackingNumber,
    );
  }

  async dispatchShipment(
    context: ShipmentDispatchContext,
  ): Promise<ShipmentGatewayResult> {
    if (shouldSimulateFailure(context.metadata)) {
      return buildFailureResult("dispatch");
    }

    if (!context.trackingNumber) {
      return {
        success: false,
        message: "Manual carrier dispatch requires a tracking number",
        metadata: {
          simulated: true,
          operation: "dispatch",
        },
      };
    }

    return buildSuccessResult(
      "dispatch",
      context.shipmentNumber,
      context.trackingNumber,
    );
  }

  async verifyShipment(
    context: ShipmentDispatchContext,
  ): Promise<ShipmentGatewayResult> {
    if (shouldSimulateFailure(context.metadata)) {
      return buildFailureResult("verify");
    }

    return {
      success:
        Boolean(context.trackingNumber) &&
        (context.status === "shipped" || context.status === "delivered"),
      gatewayReference: `MAN-VERIFY-${context.shipmentNumber}`,
      trackingNumber: context.trackingNumber,
      message: `Manual carrier verify simulated for status ${context.status}`,
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
