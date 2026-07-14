import type { CustomerAddress } from "@commerceflow/types";
import type {
  CreateCustomerAddressInput,
  UpdateCustomerAddressInput,
} from "@commerceflow/validation";

export interface CreateCustomerAddressRecordInput
  extends CreateCustomerAddressInput {
  readonly storeId: string;
  readonly customerId: string;
}

export interface CustomerAddressRepository {
  findById(storeId: string, id: string): Promise<CustomerAddress | null>;
  listByCustomerId(
    storeId: string,
    customerId: string,
  ): Promise<readonly CustomerAddress[]>;
  countActiveByCustomerId(storeId: string, customerId: string): Promise<number>;
  create(input: CreateCustomerAddressRecordInput): Promise<CustomerAddress>;
  update(
    storeId: string,
    id: string,
    input: UpdateCustomerAddressInput,
  ): Promise<CustomerAddress>;
  softDelete(storeId: string, id: string): Promise<CustomerAddress>;
}
