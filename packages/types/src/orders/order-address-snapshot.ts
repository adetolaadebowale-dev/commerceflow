/** Immutable shipping address captured on the order at checkout time. */
export interface OrderAddressSnapshot {
  readonly recipientName: string;
  readonly phone?: string;
  readonly addressLine1: string;
  readonly addressLine2?: string;
  readonly city: string;
  readonly stateProvince: string;
  readonly postalCode: string;
  readonly countryCode: string;
}
