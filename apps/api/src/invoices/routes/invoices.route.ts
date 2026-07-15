import {
  createInvoiceSchema,
  invoiceIdQuerySchema,
  listOrderInvoicesQuerySchema,
  orderInvoiceActionSchema,
} from "@commerceflow/validation";
import type { Invoice } from "@commerceflow/types";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { INVOICE_ERROR_CODES, InvoiceError } from "../errors";
import { invoiceService } from "../services";
import { handleInvoiceRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateInvoice(
  orderId: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = orderInvoiceActionSchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "invoices:write",
    );

    const invoice = await invoiceService.createInvoice(
      queryParsed.data.storeId,
      orderId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "invoice",
      entityId: invoice.id,
      action: "create",
      metadata: {
        orderId: invoice.orderId,
        invoiceNumber: invoice.invoiceNumber,
        subtotal: invoice.subtotal,
        discountAmount: invoice.discountAmount,
        total: invoice.total,
        currency: invoice.currency,
        status: invoice.status,
      },
    });

    return jsonSuccess({ invoice }, 201);
  } catch (error) {
    return handleInvoiceRouteError(error);
  }
}

export async function handleListOrderInvoices(
  orderId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = listOrderInvoicesQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "invoices:read",
    );

    const invoices = await invoiceService.listOrderInvoices(parsed.data, orderId);
    return jsonSuccess({ invoices });
  } catch (error) {
    return handleInvoiceRouteError(error);
  }
}

export async function handleGetInvoice(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = invoiceIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "invoices:read",
    );

    const invoice = await invoiceService.getInvoice(parsed.data.storeId, id);
    return jsonSuccess({ invoice });
  } catch (error) {
    return handleInvoiceRouteError(error);
  }
}

export async function handleIssueInvoice(
  id: string,
  request: Request,
): Promise<Response> {
  return handleInvoiceLifecycleAction(id, request, "issue", (query) =>
    invoiceService.issueInvoice(query, id),
  );
}

export async function handleMarkInvoicePaid(
  id: string,
  request: Request,
): Promise<Response> {
  return handleInvoiceLifecycleAction(id, request, "mark_paid", (query) =>
    invoiceService.markInvoicePaid(query, id),
  );
}

export async function handleVoidInvoice(
  id: string,
  request: Request,
): Promise<Response> {
  return handleInvoiceLifecycleAction(id, request, "void", (query) =>
    invoiceService.voidInvoice(query, id),
  );
}

async function handleInvoiceLifecycleAction(
  id: string,
  request: Request,
  action: "issue" | "mark_paid" | "void",
  execute: (query: { storeId: string }) => Promise<Invoice>,
): Promise<Response> {
  try {
    const parsed = invoiceIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new InvoiceError(
        INVOICE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "invoices:lifecycle",
    );

    const invoice = await execute(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "invoice",
      entityId: invoice.id,
      action,
      metadata: {
        orderId: invoice.orderId,
        invoiceNumber: invoice.invoiceNumber,
        subtotal: invoice.subtotal,
        discountAmount: invoice.discountAmount,
        total: invoice.total,
        currency: invoice.currency,
        status: invoice.status,
      },
    });

    return jsonSuccess({ invoice });
  } catch (error) {
    return handleInvoiceRouteError(error);
  }
}
