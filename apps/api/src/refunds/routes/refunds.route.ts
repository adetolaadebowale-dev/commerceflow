import {
  createRefundSchema,
  listPaymentRefundsQuerySchema,
  paymentRefundActionSchema,
  refundIdQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { REFUND_ERROR_CODES, RefundError } from "../errors";
import { refundService } from "../services";
import { handleRefundRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateRefund(
  paymentId: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = paymentRefundActionSchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new RefundError(
        REFUND_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = createRefundSchema.safeParse(body);

    if (!parsed.success) {
      throw new RefundError(
        REFUND_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "refunds:write",
    );

    const refund = await refundService.createRefund(
      queryParsed.data.storeId,
      paymentId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "refund",
      entityId: refund.id,
      action: "create",
      metadata: {
        paymentId: refund.paymentId,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
      },
    });

    return jsonSuccess({ refund }, 201);
  } catch (error) {
    return handleRefundRouteError(error);
  }
}

export async function handleListPaymentRefunds(
  paymentId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = listPaymentRefundsQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new RefundError(
        REFUND_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "refunds:read",
    );

    const refunds = await refundService.listPaymentRefunds(parsed.data, paymentId);
    return jsonSuccess({ refunds });
  } catch (error) {
    return handleRefundRouteError(error);
  }
}

export async function handleGetRefund(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = refundIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new RefundError(
        REFUND_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "refunds:read",
    );

    const refund = await refundService.getRefund(parsed.data.storeId, id);
    return jsonSuccess({ refund });
  } catch (error) {
    return handleRefundRouteError(error);
  }
}

export async function handleCompleteRefund(
  id: string,
  request: Request,
): Promise<Response> {
  return handleRefundLifecycleAction(id, request, "complete", (query) =>
    refundService.completeRefund(query, id),
  );
}

export async function handleCancelRefund(
  id: string,
  request: Request,
): Promise<Response> {
  return handleRefundLifecycleAction(id, request, "cancel", (query) =>
    refundService.cancelRefund(query, id),
  );
}

async function handleRefundLifecycleAction(
  id: string,
  request: Request,
  action: "complete" | "cancel",
  execute: (query: { storeId: string }) => Promise<{
    id: string;
    paymentId: string;
    amount: string;
    currency: string;
    status: string;
    reason: string;
  }>,
): Promise<Response> {
  try {
    const parsed = refundIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new RefundError(
        REFUND_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "refunds:lifecycle",
    );

    const refund = await execute(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "refund",
      entityId: refund.id,
      action,
      metadata: {
        paymentId: refund.paymentId,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
      },
    });

    return jsonSuccess({ refund });
  } catch (error) {
    return handleRefundRouteError(error);
  }
}
