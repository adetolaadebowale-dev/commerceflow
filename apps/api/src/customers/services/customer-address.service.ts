import type {
  CreateCustomerAddressInput,
  UpdateCustomerAddressInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { CUSTOMER_ERROR_CODES, CustomerError } from "../errors";
import {
  getCustomerAddressRepository,
  getCustomerRepository,
  type CustomerAddressRepository,
  type CustomerRepository,
} from "../repositories";

export interface CustomerAddressServiceDependencies {
  readonly customerRepository?: CustomerRepository;
  readonly customerAddressRepository?: CustomerAddressRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class CustomerAddressService {
  private readonly customerRepository: CustomerRepository;
  private readonly customerAddressRepository: CustomerAddressRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: CustomerAddressServiceDependencies = {}) {
    this.customerRepository =
      dependencies.customerRepository ?? getCustomerRepository();
    this.customerAddressRepository =
      dependencies.customerAddressRepository ??
      getCustomerAddressRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createCustomerAddress(
    storeId: string,
    customerId: string,
    input: CreateCustomerAddressInput,
  ) {
    await this.ensureCustomerExists(storeId, customerId);

    const address = await this.customerAddressRepository.create({
      ...input,
      storeId,
      customerId,
    });
    this.domainEventPublisher.publishCustomerAddressCreated(address);
    return address;
  }

  async updateCustomerAddress(
    storeId: string,
    id: string,
    input: UpdateCustomerAddressInput,
  ) {
    const existing = await this.customerAddressRepository.findById(storeId, id);

    if (!existing) {
      throw new CustomerError(
        CUSTOMER_ERROR_CODES.CUSTOMER_ADDRESS_NOT_FOUND,
        "Customer address not found",
        404,
      );
    }

    try {
      const updated = await this.customerAddressRepository.update(
        storeId,
        id,
        input,
      );
      this.domainEventPublisher.publishCustomerAddressUpdated(updated);
      return updated;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("CustomerAddress not found:")
      ) {
        throw new CustomerError(
          CUSTOMER_ERROR_CODES.CUSTOMER_ADDRESS_NOT_FOUND,
          "Customer address not found",
          404,
        );
      }

      throw error;
    }
  }

  async getCustomerAddress(storeId: string, id: string) {
    const address = await this.customerAddressRepository.findById(storeId, id);

    if (!address) {
      throw new CustomerError(
        CUSTOMER_ERROR_CODES.CUSTOMER_ADDRESS_NOT_FOUND,
        "Customer address not found",
        404,
      );
    }

    return address;
  }

  async listCustomerAddresses(storeId: string, customerId: string) {
    await this.ensureCustomerExists(storeId, customerId);
    return this.customerAddressRepository.listByCustomerId(storeId, customerId);
  }

  async deleteCustomerAddress(storeId: string, id: string) {
    try {
      return await this.customerAddressRepository.softDelete(storeId, id);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("CustomerAddress not found:")
      ) {
        throw new CustomerError(
          CUSTOMER_ERROR_CODES.CUSTOMER_ADDRESS_NOT_FOUND,
          "Customer address not found",
          404,
        );
      }

      throw error;
    }
  }

  private async ensureCustomerExists(storeId: string, customerId: string) {
    const customer = await this.customerRepository.findById(storeId, customerId);

    if (!customer) {
      throw new CustomerError(
        CUSTOMER_ERROR_CODES.NOT_FOUND,
        "Customer not found",
        404,
      );
    }
  }
}

export const customerAddressService = new CustomerAddressService();
