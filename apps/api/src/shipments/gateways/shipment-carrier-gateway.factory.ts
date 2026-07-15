import type {
  ShipmentCarrier,
  ShipmentCarrierGateway,
} from "@commerceflow/types";

import { SHIPMENT_ERROR_CODES, ShipmentError } from "../errors";

export interface ShipmentCarrierGatewayFactory {
  resolve(carrier: ShipmentCarrier): ShipmentCarrierGateway;
}

export class DefaultShipmentCarrierGatewayFactory
  implements ShipmentCarrierGatewayFactory
{
  constructor(
    private readonly gateways: ReadonlyMap<
      ShipmentCarrier,
      ShipmentCarrierGateway
    >,
  ) {}

  resolve(carrier: ShipmentCarrier): ShipmentCarrierGateway {
    const gateway = this.gateways.get(carrier);

    if (!gateway) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.UNSUPPORTED_CARRIER,
        `Unsupported shipment carrier: ${carrier}`,
        400,
      );
    }

    return gateway;
  }
}
