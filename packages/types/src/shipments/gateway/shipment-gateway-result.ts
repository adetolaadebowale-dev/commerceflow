/** Result returned by shipment carrier gateway operations. */
export interface ShipmentGatewayResult {
  readonly success: boolean;
  readonly gatewayReference?: string;
  readonly trackingNumber?: string;
  readonly message?: string;
  readonly metadata?: Record<string, unknown>;
}
