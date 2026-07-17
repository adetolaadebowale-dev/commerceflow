import { updateStoreSettingsSchema } from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import {
  STORE_ADMINISTRATION_ERROR_CODES,
  StoreAdministrationError,
} from "../errors";
import { storeAdministrationService } from "../services";
import {
  handleStoreAdministrationRouteError,
  jsonSuccess,
} from "./http-response";

function storeSettingsAuditMetadata(store: {
  name: string;
  slug: string;
  settings: {
    defaultCurrency: string;
    defaultTimezone: string;
    locale: string;
  };
}) {
  return {
    name: store.name,
    slug: store.slug,
    settings: store.settings,
  };
}

export async function handleGetStoreSettings(
  storeId: string,
  request: Request,
): Promise<Response> {
  try {
    await authorizationService.authorizeStoreRequest(
      request,
      storeId,
      "stores:read",
    );

    const store = await storeAdministrationService.getStoreSettings(storeId);
    return jsonSuccess({ store });
  } catch (error) {
    return handleStoreAdministrationRouteError(error);
  }
}

export async function handleUpdateStoreSettings(
  storeId: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = updateStoreSettingsSchema.safeParse(body);

    if (!parsed.success) {
      throw new StoreAdministrationError(
        STORE_ADMINISTRATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      storeId,
      "stores:write",
    );

    const store = await storeAdministrationService.updateStoreSettings(
      storeId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "store",
      entityId: store.id,
      action: "update_settings",
      metadata: storeSettingsAuditMetadata(store),
    });

    return jsonSuccess({ store });
  } catch (error) {
    return handleStoreAdministrationRouteError(error);
  }
}
