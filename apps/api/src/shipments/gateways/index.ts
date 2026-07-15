import type { ShipmentCarrier, ShipmentCarrierGateway } from "@commerceflow/types";

import { InternalShipmentCarrierGateway } from "./internal-shipment-carrier.gateway";
import { ManualShipmentCarrierGateway } from "./manual-shipment-carrier.gateway";
import {
  DefaultShipmentCarrierGatewayFactory,
  type ShipmentCarrierGatewayFactory,
} from "./shipment-carrier-gateway.factory";

const internalGateway: ShipmentCarrierGateway =
  new InternalShipmentCarrierGateway();
const manualGateway: ShipmentCarrierGateway = new ManualShipmentCarrierGateway();

const shipmentCarrierGatewayFactory: ShipmentCarrierGatewayFactory =
  new DefaultShipmentCarrierGatewayFactory(
    new Map<ShipmentCarrier, ShipmentCarrierGateway>([
      ["internal", internalGateway],
      ["manual", manualGateway],
    ]),
  );

export function getShipmentCarrierGatewayFactory(): ShipmentCarrierGatewayFactory {
  return shipmentCarrierGatewayFactory;
}

export type { ShipmentCarrierGatewayFactory } from "./shipment-carrier-gateway.factory";
export { InternalShipmentCarrierGateway } from "./internal-shipment-carrier.gateway";
export { ManualShipmentCarrierGateway } from "./manual-shipment-carrier.gateway";
export { DefaultShipmentCarrierGatewayFactory } from "./shipment-carrier-gateway.factory";
