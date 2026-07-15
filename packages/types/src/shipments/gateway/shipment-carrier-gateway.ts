import type { ShipmentCarrier } from "../shipment-carrier";
import type {
  ShipmentDispatchContext,
  ShipmentInitializeRequest,
} from "./shipment-gateway-requests";
import type { ShipmentGatewayResult } from "./shipment-gateway-result";

/** Provider-agnostic shipment carrier gateway contract. */
export interface ShipmentCarrierGateway {
  readonly carrier: ShipmentCarrier;

  initializeShipment(
    request: ShipmentInitializeRequest,
  ): Promise<ShipmentGatewayResult>;

  dispatchShipment(
    context: ShipmentDispatchContext,
  ): Promise<ShipmentGatewayResult>;

  verifyShipment(
    context: ShipmentDispatchContext,
  ): Promise<ShipmentGatewayResult>;

  cancelShipment(
    context: ShipmentDispatchContext,
  ): Promise<ShipmentGatewayResult>;
}
