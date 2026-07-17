import {
  createWebhookSchema,
  listWebhookDeliveriesQuerySchema,
  listWebhooksQuerySchema,
  updateWebhookSchema,
  webhookIdQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { getQueryParams } from "@/jobs/routes/request-utils";
import { WEBHOOK_ERROR_CODES, WebhookError } from "../errors";
import { webhookService } from "../services";
import { handleWebhookRouteError, jsonSuccess } from "./http-response";

function webhookAuditMetadata(webhook: {
  id: string;
  url: string;
  enabled: boolean;
  subscribedEvents: readonly string[];
}) {
  return {
    webhookId: webhook.id,
    url: webhook.url,
    enabled: webhook.enabled,
    subscribedEvents: webhook.subscribedEvents,
  };
}

export async function handleCreateWebhook(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createWebhookSchema.safeParse(body);

    if (!parsed.success) {
      throw new WebhookError(
        WEBHOOK_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "webhooks:write",
    );

    const webhook = await webhookService.createWebhook(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "webhook",
      entityId: webhook.id,
      action: "create",
      metadata: webhookAuditMetadata(webhook),
    });

    return jsonSuccess({ webhook }, 201);
  } catch (error) {
    return handleWebhookRouteError(error);
  }
}

export async function handleListWebhooks(request: Request): Promise<Response> {
  try {
    const parsed = listWebhooksQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new WebhookError(
        WEBHOOK_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "webhooks:read",
    );

    const result = await webhookService.listWebhooks(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleWebhookRouteError(error);
  }
}

export async function handleGetWebhook(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = webhookIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new WebhookError(
        WEBHOOK_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "webhooks:read",
    );

    const webhook = await webhookService.getWebhook(parsed.data.storeId, id);
    return jsonSuccess({ webhook });
  } catch (error) {
    return handleWebhookRouteError(error);
  }
}

export async function handleUpdateWebhook(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsedBody = updateWebhookSchema.safeParse(body);
    const parsedQuery = webhookIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsedBody.success) {
      throw new WebhookError(
        WEBHOOK_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsedBody.error.flatten(),
      );
    }

    if (!parsedQuery.success) {
      throw new WebhookError(
        WEBHOOK_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsedQuery.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsedQuery.data.storeId,
      "webhooks:write",
    );

    const webhook = await webhookService.updateWebhook(
      parsedQuery.data.storeId,
      id,
      parsedBody.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "webhook",
      entityId: webhook.id,
      action: "update",
      metadata: webhookAuditMetadata(webhook),
    });

    return jsonSuccess({ webhook });
  } catch (error) {
    return handleWebhookRouteError(error);
  }
}

export async function handleListWebhookDeliveries(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = listWebhookDeliveriesQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new WebhookError(
        WEBHOOK_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "webhooks:read",
    );

    const result = await webhookService.listDeliveries(
      parsed.data.storeId,
      id,
      parsed.data,
    );

    return jsonSuccess(result);
  } catch (error) {
    return handleWebhookRouteError(error);
  }
}
