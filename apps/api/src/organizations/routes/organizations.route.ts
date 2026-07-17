import { updateOrganizationSchema } from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { ORGANIZATION_ERROR_CODES, OrganizationError } from "../errors";
import { organizationService } from "../services";
import { handleOrganizationRouteError, jsonSuccess } from "./http-response";

function organizationAuditMetadata(organization: {
  name: string;
  slug: string;
}) {
  return {
    name: organization.name,
    slug: organization.slug,
  };
}

export async function handleGetOrganization(id: string, request: Request) {
  try {
    await authorizationService.authorizeOrganizationRequest(
      request,
      id,
      "organizations:read",
    );

    const organization = await organizationService.getOrganization(id);
    return jsonSuccess({ organization });
  } catch (error) {
    return handleOrganizationRouteError(error);
  }
}

export async function handleUpdateOrganization(id: string, request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = updateOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      throw new OrganizationError(
        ORGANIZATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeOrganizationRequest(
      request,
      id,
      "organizations:write",
    );

    const organization = await organizationService.updateOrganization(
      id,
      parsed.data,
    );

    auditService.recordFromOrganizationAuthContext(authContext, {
      entityType: "organization",
      entityId: organization.id,
      action: "update",
      metadata: organizationAuditMetadata(organization),
    });

    return jsonSuccess({ organization });
  } catch (error) {
    return handleOrganizationRouteError(error);
  }
}

export async function handleListOrganizationStores(
  id: string,
  request: Request,
) {
  try {
    await authorizationService.authorizeOrganizationRequest(
      request,
      id,
      "organizations:read",
    );

    const stores = await organizationService.listOrganizationStores(id);
    return jsonSuccess({ stores });
  } catch (error) {
    return handleOrganizationRouteError(error);
  }
}
