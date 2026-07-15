import type { Invoice, InvoiceStatus } from "@commerceflow/types";
import type {
  CreateInvoiceInput,
  InvoiceIdQuery,
  ListOrderInvoicesQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { getOrderRepository, type OrderRepository } from "@/orders/repositories";
import { INVOICE_ERROR_CODES, InvoiceError } from "../errors";
import { InvoiceStatusTransitionPolicy } from "../policies/invoice-status-transition.policy";
import {
  getInvoiceRepository,
  type InvoiceRepository,
} from "../repositories";

export interface InvoiceServiceDependencies {
  readonly invoiceRepository?: InvoiceRepository;
  readonly orderRepository?: OrderRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class InvoiceService {
  private readonly invoiceRepository: InvoiceRepository;
  private readonly orderRepository: OrderRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: InvoiceServiceDependencies = {}) {
    this.invoiceRepository =
      dependencies.invoiceRepository ?? getInvoiceRepository();
    this.orderRepository =
      dependencies.orderRepository ?? getOrderRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createInvoice(
    storeId: string,
    orderId: string,
    input: CreateInvoiceInput,
  ): Promise<Invoice> {
    const order = await this.orderRepository.findById(storeId, orderId);

    if (!order) {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404,
      );
    }

    const existing = await this.invoiceRepository.findByOrderId(storeId, orderId);

    if (existing) {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.ALREADY_EXISTS,
        "Order already has an invoice",
        409,
      );
    }

    try {
      const invoice = await this.invoiceRepository.create({
        storeId,
        orderId,
        subtotal: order.subtotal,
        currency: order.currency,
        dueAt: input.dueAt,
      });

      this.domainEventPublisher.publishInvoiceCreated(invoice);
      return invoice;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async getInvoice(storeId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(storeId, invoiceId);

    if (!invoice) {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.NOT_FOUND,
        "Invoice not found",
        404,
      );
    }

    return invoice;
  }

  async listOrderInvoices(
    query: ListOrderInvoicesQuery,
    orderId: string,
  ): Promise<readonly Invoice[]> {
    const order = await this.orderRepository.findById(query.storeId, orderId);

    if (!order) {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404,
      );
    }

    return this.invoiceRepository.listByOrderId(query.storeId, orderId);
  }

  async issueInvoice(query: InvoiceIdQuery, invoiceId: string): Promise<Invoice> {
    return this.transitionInvoice(query.storeId, invoiceId, "issued", {
      issuedAt: new Date().toISOString(),
    });
  }

  async markInvoicePaid(
    query: InvoiceIdQuery,
    invoiceId: string,
  ): Promise<Invoice> {
    const existing = await this.requireInvoice(query.storeId, invoiceId);
    this.assertMutableForLifecycle(existing, "paid");

    return this.transitionInvoice(query.storeId, invoiceId, "paid", {
      paidAt: new Date().toISOString(),
    });
  }

  async voidInvoice(query: InvoiceIdQuery, invoiceId: string): Promise<Invoice> {
    return this.transitionInvoice(query.storeId, invoiceId, "void");
  }

  private async transitionInvoice(
    storeId: string,
    invoiceId: string,
    toStatus: InvoiceStatus,
    timestamps: { issuedAt?: string; paidAt?: string } = {},
  ): Promise<Invoice> {
    const existing = await this.requireInvoice(storeId, invoiceId);

    if (!InvoiceStatusTransitionPolicy.canTransition(existing.status, toStatus)) {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.INVALID_TRANSITION,
        `Cannot transition invoice from ${existing.status} to ${toStatus}`,
        409,
      );
    }

    if (toStatus === "issued") {
      this.assertDraftOnly(existing);
    }

    try {
      const invoice = await this.invoiceRepository.transitionStatus(
        storeId,
        invoiceId,
        {
          fromStatus: existing.status,
          toStatus,
          ...timestamps,
        },
      );

      this.publishTransitionEvent(invoice, existing.status);
      return invoice;
    } catch (error) {
      throw this.mapRepositoryError(error, existing.status, toStatus);
    }
  }

  private assertDraftOnly(invoice: Invoice): void {
    if (invoice.status !== "draft") {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.IMMUTABLE,
        "Only draft invoices may be issued",
        409,
      );
    }
  }

  private assertMutableForLifecycle(invoice: Invoice, targetStatus: InvoiceStatus): void {
    if (invoice.status === "paid" || invoice.status === "void") {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.IMMUTABLE,
        `Invoice is immutable in ${invoice.status} status`,
        409,
      );
    }

    if (targetStatus === "paid" && invoice.status !== "issued") {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.INVALID_TRANSITION,
        "Only issued invoices may be marked paid",
        409,
      );
    }
  }

  private async requireInvoice(
    storeId: string,
    invoiceId: string,
  ): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(storeId, invoiceId);

    if (!invoice) {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.NOT_FOUND,
        "Invoice not found",
        404,
      );
    }

    return invoice;
  }

  private publishTransitionEvent(
    invoice: Invoice,
    previousStatus: InvoiceStatus,
  ): void {
    switch (invoice.status) {
      case "issued":
        this.domainEventPublisher.publishInvoiceIssued(invoice, previousStatus);
        break;
      case "paid":
        this.domainEventPublisher.publishInvoicePaid(invoice, previousStatus);
        break;
      case "void":
        this.domainEventPublisher.publishInvoiceVoided(invoice, previousStatus);
        break;
      default:
        break;
    }
  }

  private mapRepositoryError(
    error: unknown,
    fromStatus?: InvoiceStatus,
    toStatus?: InvoiceStatus,
  ): InvoiceError {
    if (error instanceof Error && error.message.startsWith("Invoice not found:")) {
      return new InvoiceError(
        INVOICE_ERROR_CODES.NOT_FOUND,
        "Invoice not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Invoice transition rejected:")
    ) {
      return new InvoiceError(
        INVOICE_ERROR_CODES.INVALID_TRANSITION,
        `Cannot transition invoice from ${fromStatus} to ${toStatus}`,
        409,
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return new InvoiceError(
        INVOICE_ERROR_CODES.ALREADY_EXISTS,
        "Order already has an invoice",
        409,
      );
    }

    if (error instanceof InvoiceError) {
      return error;
    }

    return new InvoiceError(
      INVOICE_ERROR_CODES.TRANSACTION_FAILED,
      "Invoice transaction failed",
      500,
    );
  }
}

export const invoiceService = new InvoiceService();
