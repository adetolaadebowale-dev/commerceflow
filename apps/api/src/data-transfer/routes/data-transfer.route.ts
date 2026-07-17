import {
  createExportJobSchema,
  createImportJobSchema,
  dataTransferJobIdQuerySchema,
  listExportJobsQuerySchema,
  listImportJobsQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { getQueryParams } from "@/jobs/routes/request-utils";
import { DATA_TRANSFER_ERROR_CODES, DataTransferError } from "../errors";
import { dataTransferService } from "../services";
import { handleDataTransferRouteError, jsonSuccess } from "./http-response";

function importJobAuditMetadata(job: {
  id: string;
  type: string;
  status: string;
  format: string;
}) {
  return {
    importJobId: job.id,
    type: job.type,
    status: job.status,
    format: job.format,
  };
}

function exportJobAuditMetadata(job: {
  id: string;
  type: string;
  status: string;
  format: string;
}) {
  return {
    exportJobId: job.id,
    type: job.type,
    status: job.status,
    format: job.format,
  };
}

export async function handleCreateImportJob(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createImportJobSchema.safeParse(body);

    if (!parsed.success) {
      throw new DataTransferError(
        DATA_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "imports:write",
    );

    const importJob = await dataTransferService.createImportJob(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "import",
      entityId: importJob.id,
      action: "create",
      metadata: importJobAuditMetadata(importJob),
    });

    if (importJob.status === "completed") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "import",
        entityId: importJob.id,
        action: "complete",
        metadata: importJobAuditMetadata(importJob),
      });
    }

    if (importJob.status === "failed") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "import",
        entityId: importJob.id,
        action: "fail",
        metadata: {
          ...importJobAuditMetadata(importJob),
          failureReason: importJob.failureReason,
        },
      });
    }

    return jsonSuccess({ importJob }, 201);
  } catch (error) {
    return handleDataTransferRouteError(error);
  }
}

export async function handleListImportJobs(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listImportJobsQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new DataTransferError(
        DATA_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "imports:read",
    );

    const result = await dataTransferService.listImportJobs(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleDataTransferRouteError(error);
  }
}

export async function handleGetImportJob(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = dataTransferJobIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new DataTransferError(
        DATA_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "imports:read",
    );

    const importJob = await dataTransferService.getImportJob(
      parsed.data.storeId,
      id,
    );

    return jsonSuccess({ importJob });
  } catch (error) {
    return handleDataTransferRouteError(error);
  }
}

export async function handleCreateExportJob(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createExportJobSchema.safeParse(body);

    if (!parsed.success) {
      throw new DataTransferError(
        DATA_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "exports:write",
    );

    const exportJob = await dataTransferService.createExportJob(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "export",
      entityId: exportJob.id,
      action: "create",
      metadata: exportJobAuditMetadata(exportJob),
    });

    if (exportJob.status === "completed") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "export",
        entityId: exportJob.id,
        action: "complete",
        metadata: exportJobAuditMetadata(exportJob),
      });
    }

    if (exportJob.status === "failed") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "export",
        entityId: exportJob.id,
        action: "fail",
        metadata: {
          ...exportJobAuditMetadata(exportJob),
          failureReason: exportJob.failureReason,
        },
      });
    }

    return jsonSuccess({ exportJob }, 201);
  } catch (error) {
    return handleDataTransferRouteError(error);
  }
}

export async function handleListExportJobs(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listExportJobsQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new DataTransferError(
        DATA_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "exports:read",
    );

    const result = await dataTransferService.listExportJobs(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleDataTransferRouteError(error);
  }
}

export async function handleGetExportJob(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = dataTransferJobIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new DataTransferError(
        DATA_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "exports:read",
    );

    const exportJob = await dataTransferService.getExportJob(
      parsed.data.storeId,
      id,
    );

    return jsonSuccess({ exportJob });
  } catch (error) {
    return handleDataTransferRouteError(error);
  }
}
