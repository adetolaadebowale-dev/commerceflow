import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { JOB_SIMULATE_FAILURE_KEY } from "../executors/job-executor";
import {
  createMemoryJobModule,
  TEST_STORE_A_ID,
  validCreateJobInput,
} from "../testing/job-test-utils";

describe("Job audit integration", () => {
  it("records job create, run, and complete audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryJobModule();

    const created = await module.jobService.createJob(validCreateJobInput());

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-id",
      sessionId: "session-id",
      entityType: "job",
      entityId: created.id,
      action: "create",
      metadata: { jobId: created.id, type: created.type, status: created.status },
    });

    const completed = await module.jobService.runJob(TEST_STORE_A_ID, created.id);

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-id",
      sessionId: "session-id",
      entityType: "job",
      entityId: completed.id,
      action: "run",
      metadata: { jobId: completed.id, type: completed.type, status: completed.status },
    });

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-id",
      sessionId: "session-id",
      entityType: "job",
      entityId: completed.id,
      action: "complete",
      metadata: { jobId: completed.id, type: completed.type, status: completed.status },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(3);
    });

    expect(auditLogRepository.getAll().map((entry) => entry.action)).toEqual([
      "create",
      "run",
      "complete",
    ]);
  });

  it("records job fail audit entries on execution failure", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryJobModule();

    const created = await module.jobService.createJob(
      validCreateJobInput({
        payload: { [JOB_SIMULATE_FAILURE_KEY]: true },
      }),
    );

    const failed = await module.jobService.runJob(TEST_STORE_A_ID, created.id);

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-id",
      sessionId: "session-id",
      entityType: "job",
      entityId: failed.id,
      action: "fail",
      metadata: {
        jobId: failed.id,
        type: failed.type,
        status: failed.status,
        failureReason: failed.failureReason,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "job",
      action: "fail",
    });
  });
});
