import { Prisma } from "@prisma/client";
import type { CatalogueListResult, Customer } from "@commerceflow/types";
import type {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { CUSTOMER_ERROR_CODES, CustomerError } from "../errors";
import {
  getCustomerRepository,
  type CustomerRepository,
} from "../repositories";

export interface CustomerServiceDependencies {
  readonly customerRepository?: CustomerRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class CustomerService {
  private readonly customerRepository: CustomerRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: CustomerServiceDependencies = {}) {
    this.customerRepository =
      dependencies.customerRepository ?? getCustomerRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const existing = await this.customerRepository.findByEmail(
      input.storeId,
      input.email,
    );

    if (existing) {
      throw new CustomerError(
        CUSTOMER_ERROR_CODES.EMAIL_ALREADY_EXISTS,
        "A customer with this email already exists",
        409,
      );
    }

    try {
      const customer = await this.customerRepository.create(input);
      this.domainEventPublisher.publishCustomerCreated(customer);
      return customer;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new CustomerError(
          CUSTOMER_ERROR_CODES.EMAIL_ALREADY_EXISTS,
          "A customer with this email already exists",
          409,
        );
      }

      throw error;
    }
  }

  async updateCustomer(
    storeId: string,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer> {
    const customer = await this.customerRepository.findById(storeId, id);

    if (!customer) {
      throw new CustomerError(
        CUSTOMER_ERROR_CODES.NOT_FOUND,
        "Customer not found",
        404,
      );
    }

    if (input.email && input.email !== customer.email) {
      const existing = await this.customerRepository.findByEmail(
        storeId,
        input.email,
      );

      if (existing) {
        throw new CustomerError(
          CUSTOMER_ERROR_CODES.EMAIL_ALREADY_EXISTS,
          "A customer with this email already exists",
          409,
        );
      }
    }

    try {
      const updated = await this.customerRepository.update(storeId, id, input);
      this.domainEventPublisher.publishCustomerUpdated(updated);
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new CustomerError(
          CUSTOMER_ERROR_CODES.EMAIL_ALREADY_EXISTS,
          "A customer with this email already exists",
          409,
        );
      }

      if (error instanceof Error && error.message.startsWith("Customer not found:")) {
        throw new CustomerError(
          CUSTOMER_ERROR_CODES.NOT_FOUND,
          "Customer not found",
          404,
        );
      }

      throw error;
    }
  }

  async getCustomer(storeId: string, id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(storeId, id);

    if (!customer) {
      throw new CustomerError(
        CUSTOMER_ERROR_CODES.NOT_FOUND,
        "Customer not found",
        404,
      );
    }

    return customer;
  }

  async listCustomers(
    query: ListCustomersQuery,
  ): Promise<CatalogueListResult<Customer>> {
    return this.customerRepository.list(query);
  }

  async deleteCustomer(storeId: string, id: string): Promise<Customer> {
    try {
      return await this.customerRepository.softDelete(storeId, id);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Customer not found:")) {
        throw new CustomerError(
          CUSTOMER_ERROR_CODES.NOT_FOUND,
          "Customer not found",
          404,
        );
      }

      throw error;
    }
  }
}

export const customerService = new CustomerService();
