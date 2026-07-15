import { Prisma } from "@prisma/client";
import type { Supplier, SupplierContact } from "@commerceflow/types";
import type {
  CreateSupplierContactInput,
  CreateSupplierInput,
  ListSuppliersQuery,
  UpdateSupplierContactInput,
  UpdateSupplierInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { SUPPLIER_ERROR_CODES, SupplierError } from "../errors";
import {
  getSupplierRepository,
  type SupplierRepository,
} from "../repositories";

export interface SupplierServiceDependencies {
  readonly supplierRepository?: SupplierRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class SupplierService {
  private readonly supplierRepository: SupplierRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: SupplierServiceDependencies = {}) {
    this.supplierRepository =
      dependencies.supplierRepository ?? getSupplierRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createSupplier(input: CreateSupplierInput): Promise<Supplier> {
    try {
      const supplier = await this.supplierRepository.create(input);
      this.domainEventPublisher.publishSupplierCreated(supplier);
      return supplier;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async updateSupplier(
    storeId: string,
    id: string,
    input: UpdateSupplierInput,
  ): Promise<Supplier> {
    try {
      const supplier = await this.supplierRepository.update(storeId, id, input);
      this.domainEventPublisher.publishSupplierUpdated(supplier);
      return supplier;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async getSupplier(storeId: string, id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findById(storeId, id);

    if (!supplier) {
      throw new SupplierError(
        SUPPLIER_ERROR_CODES.NOT_FOUND,
        "Supplier not found",
        404,
      );
    }

    return supplier;
  }

  async listSuppliers(query: ListSuppliersQuery) {
    return this.supplierRepository.list(query);
  }

  async softDeleteSupplier(storeId: string, id: string): Promise<Supplier> {
    try {
      const supplier = await this.supplierRepository.softDelete(storeId, id);
      this.domainEventPublisher.publishSupplierDeleted(supplier);
      return supplier;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async createContact(
    supplierId: string,
    input: CreateSupplierContactInput,
  ): Promise<SupplierContact> {
    try {
      const contact = await this.supplierRepository.createContact(
        input.storeId,
        supplierId,
        input,
      );
      this.domainEventPublisher.publishSupplierContactCreated(
        contact,
        input.storeId,
      );
      return contact;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async updateContact(
    contactId: string,
    input: UpdateSupplierContactInput,
  ): Promise<SupplierContact> {
    try {
      const contact = await this.supplierRepository.updateContact(
        input.storeId,
        contactId,
        input,
      );
      this.domainEventPublisher.publishSupplierContactUpdated(
        contact,
        input.storeId,
      );
      return contact;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async deleteContact(storeId: string, contactId: string): Promise<SupplierContact> {
    try {
      const contact = await this.supplierRepository.deleteContact(
        storeId,
        contactId,
      );
      this.domainEventPublisher.publishSupplierContactDeleted(contact, storeId);
      return contact;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private mapRepositoryError(error: unknown): SupplierError {
    if (
      error instanceof Error &&
      error.message.startsWith("Supplier not found:")
    ) {
      return new SupplierError(
        SUPPLIER_ERROR_CODES.NOT_FOUND,
        "Supplier not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Supplier contact not found:")
    ) {
      return new SupplierError(
        SUPPLIER_ERROR_CODES.CONTACT_NOT_FOUND,
        "Supplier contact not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Supplier code already exists:")
    ) {
      return new SupplierError(
        SUPPLIER_ERROR_CODES.CODE_ALREADY_EXISTS,
        "Supplier code already exists for this store",
        409,
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return new SupplierError(
        SUPPLIER_ERROR_CODES.CODE_ALREADY_EXISTS,
        "Supplier code already exists for this store",
        409,
      );
    }

    if (error instanceof SupplierError) {
      return error;
    }

    return new SupplierError(
      SUPPLIER_ERROR_CODES.TRANSACTION_FAILED,
      "Supplier transaction failed",
      500,
    );
  }
}

export const supplierService = new SupplierService();
