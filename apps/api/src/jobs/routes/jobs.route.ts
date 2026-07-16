import {
  createJobSchema,
  jobIdQuerySchema,
  listJobsQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { JOB_ERROR_CODES, JobError } from "../errors";
import { jobService } from "../services";
import { handleJobRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function jobAuditMetadata(job: {
  id: string;
  type: string;
  status: string;
}) {
  return {
    jobId: job.id,
    type: job.type,
    status: job.status,
  };
}

export async function handleCreateJob(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      throw new JobError(
        JOB_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "jobs:write",
    );

    const job = await jobService.createJob(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "job",
      entityId: job.id,
      action: "create",
      metadata: jobAuditMetadata(job),
    });

    return jsonSuccess({ job }, 201);
  } catch (error) {
    return handleJobRouteError(error);
  }
}

export async function handleListJobs(request: Request): Promise<Response> {
  try {
    const parsed = listJobsQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new JobError(
        JOB_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "jobs:read",
    );

    const result = await jobService.listJobs(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleJobRouteError(error);
  }
}

export async function handleGetJob(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = jobIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new JobError(
        JOB_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "jobs:read",
    );

    const job = await jobService.getJob(parsed.data.storeId, id);
    return jsonSuccess({ job });
  } catch (error) {
    return handleJobRouteError(error);
  }
}

export async function handleRunJob(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = jobIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new JobError(
        JOB_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "jobs:write",
    );

    const job = await jobService.runJob(parsed.data.storeId, id);

    auditService.recordFromAuthContext(authContext, {
      entityType: "job",
      entityId: job.id,
      action: "run",
      metadata: jobAuditMetadata(job),
    });

    if (job.status === "completed") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "job",
        entityId: job.id,
        action: "complete",
        metadata: jobAuditMetadata(job),
      });
    }

    if (job.status === "failed") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "job",
        entityId: job.id,
        action: "fail",
        metadata: {
          ...jobAuditMetadata(job),
          failureReason: job.failureReason,
        },
      });
    }

    return jsonSuccess({ job });
  } catch (error) {
    return handleJobRouteError(error);
  }
}
