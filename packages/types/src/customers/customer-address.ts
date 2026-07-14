/** Store-scoped postal address belonging to a customer profile. */
export interface CustomerAddress {
  readonly id: string;
  readonly customerId: string;
  readonly storeId: string;
  readonly label: string;
  readonly recipientName: string;
  readonly phone?: string;
  readonly addressLine1: string;
  readonly addressLine2?: string;
  readonly city: string;
  readonly stateProvince: string;
  readonly postalCode: string;
  readonly countryCode: string;
  readonly isDefault: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
