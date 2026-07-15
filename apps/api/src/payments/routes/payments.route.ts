import {
  createPaymentSchema,
  listOrderPaymentsQuerySchema,
  orderPaymentActionSchema,
  paymentIdQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { PAYMENT_ERROR_CODES, PaymentError } from "../errors";
import { paymentService } from "../services";
import { handlePaymentRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreatePayment(
  orderId: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = orderPaymentActionSchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "payments:write",
    );

    const payment = await paymentService.createPayment(
      queryParsed.data.storeId,
      orderId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "payment",
      entityId: payment.id,
      action: "create",
      metadata: {
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider,
        reference: payment.reference,
      },
    });

    return jsonSuccess({ payment }, 201);
  } catch (error) {
    return handlePaymentRouteError(error);
  }
}

export async function handleListOrderPayments(
  orderId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = listOrderPaymentsQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "payments:read",
    );

    const payments = await paymentService.listOrderPayments(parsed.data, orderId);
    return jsonSuccess({ payments });
  } catch (error) {
    return handlePaymentRouteError(error);
  }
}

export async function handleGetPayment(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = paymentIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "payments:read",
    );

    const payment = await paymentService.getPayment(parsed.data.storeId, id);
    return jsonSuccess({ payment });
  } catch (error) {
    return handlePaymentRouteError(error);
  }
}

export async function handleAuthorizePayment(
  id: string,
  request: Request,
): Promise<Response> {
  return handlePaymentLifecycleAction(id, request, "authorize", (query) =>
    paymentService.authorizePayment(query, id),
  );
}

export async function handleMarkPaymentPaid(
  id: string,
  request: Request,
): Promise<Response> {
  return handlePaymentLifecycleAction(id, request, "mark_paid", (query) =>
    paymentService.markPaymentPaid(query, id),
  );
}

export async function handleFailPayment(
  id: string,
  request: Request,
): Promise<Response> {
  return handlePaymentLifecycleAction(id, request, "fail", (query) =>
    paymentService.failPayment(query, id),
  );
}

export async function handleCancelPayment(
  id: string,
  request: Request,
): Promise<Response> {
  return handlePaymentLifecycleAction(id, request, "cancel", (query) =>
    paymentService.cancelPayment(query, id),
  );
}

async function handlePaymentLifecycleAction(
  id: string,
  request: Request,
  action: "authorize" | "mark_paid" | "fail" | "cancel",
  execute: (query: { storeId: string }) => Promise<{ id: string; orderId: string; amount: string; currency: string; status: string; reference: string }>,
): Promise<Response> {
  try {
    const parsed = paymentIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "payments:lifecycle",
    );

    const payment = await execute(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "payment",
      entityId: payment.id,
      action,
      metadata: {
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        reference: payment.reference,
      },
    });

    return jsonSuccess({ payment });
  } catch (error) {
    return handlePaymentRouteError(error);
  }
}
