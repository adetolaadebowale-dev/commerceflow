import { databaseOptimizationStoreQuerySchema } from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { getQueryParams } from "@/jobs/routes/request-utils";
import {
  DATABASE_OPTIMIZATION_ERROR_CODES,
  DatabaseOptimizationError,
} from "../errors";
import { databaseOptimizationFacade } from "../services";
import {
  handleDatabaseOptimizationRouteError,
  jsonSuccess,
} from "./http-response";

async function authorizePlatformRead(request: Request) {
  const parsed = databaseOptimizationStoreQuerySchema.safeParse(
    getQueryParams(request),
  );

  if (!parsed.success) {
    throw new DatabaseOptimizationError(
      DATABASE_OPTIMIZATION_ERROR_CODES.VALIDATION_ERROR,
      "Validation failed",
      400,
      parsed.error.flatten(),
    );
  }

  const authContext = await authorizationService.authorizeStoreRequest(
    request,
    parsed.data.storeId,
    "platform:read",
  );

  return { storeId: parsed.data.storeId, authContext };
}

function recordDiagnosticsAudit(
  authContext: Awaited<
    ReturnType<typeof authorizationService.authorizeStoreRequest>
  >,
  diagnostics: {
    status: string;
    databaseReachable: boolean;
    indexes: { total: number };
    migrations: { consistent: boolean; migrationCount: number };
  },
) {
  auditService.recordFromAuthContext(authContext, {
    entityType: "platform",
    entityId: "platform",
    action: "database_diagnostics",
    metadata: {
      status: diagnostics.status,
      databaseReachable: diagnostics.databaseReachable,
      indexCount: diagnostics.indexes.total,
      migrationCount: diagnostics.migrations.migrationCount,
      migrationsConsistent: diagnostics.migrations.consistent,
    },
  });
}

export async function handleGetPlatformDatabase(
  request: Request,
): Promise<Response> {
  try {
    const { authContext } = await authorizePlatformRead(request);
    const database = await databaseOptimizationFacade.getDatabaseSummary();
    recordDiagnosticsAudit(authContext, database);
    return jsonSuccess({ database });
  } catch (error) {
    return handleDatabaseOptimizationRouteError(error);
  }
}

export async function handleGetPlatformDatabaseIndexes(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const indexes = databaseOptimizationFacade.getIndexSummary();
    return jsonSuccess({ indexes });
  } catch (error) {
    return handleDatabaseOptimizationRouteError(error);
  }
}

export async function handleGetPlatformDatabaseDiagnostics(
  request: Request,
): Promise<Response> {
  try {
    const { authContext } = await authorizePlatformRead(request);
    const diagnostics = await databaseOptimizationFacade.getDiagnostics();
    recordDiagnosticsAudit(authContext, diagnostics);
    return jsonSuccess({ diagnostics });
  } catch (error) {
    return handleDatabaseOptimizationRouteError(error);
  }
}
