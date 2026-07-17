import { describe, expect, it } from "vitest";

import { createImportJobSchema } from "@commerceflow/validation";

import { DATA_TRANSFER_ERROR_CODES } from "../errors";
import {
  createMemoryDataTransferModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validCreateExportJobInput,
  validCreateImportJobInput,
} from "../testing/data-transfer-test-utils";

describe("DataTransferService", () => {
  it("creates import jobs that complete via placeholder processor", async () => {
    const module = createMemoryDataTransferModule();

    const importJob = await module.dataTransferService.createImportJob(
      validCreateImportJobInput({ type: "customers" }),
    );

    expect(importJob).toMatchObject({
      storeId: TEST_STORE_A_ID,
      type: "customers",
      format: "csv",
      status: "completed",
    });
    expect(importJob.metadata).toMatchObject({
      processedRows: 0,
    });
    expect(importJob.completedAt).toBeDefined();
  });

  it("creates export jobs that complete via placeholder processor", async () => {
    const module = createMemoryDataTransferModule();

    const exportJob = await module.dataTransferService.createExportJob(
      validCreateExportJobInput({ type: "inventory" }),
    );

    expect(exportJob).toMatchObject({
      storeId: TEST_STORE_A_ID,
      type: "inventory",
      status: "completed",
    });
    expect(exportJob.metadata).toMatchObject({
      exportedRows: 0,
    });
  });

  it("marks jobs as failed when placeholder processor simulates failure", async () => {
    const module = createMemoryDataTransferModule();

    const importJob = await module.dataTransferService.createImportJob(
      validCreateImportJobInput({ metadata: { simulateFailure: true } }),
    );

    expect(importJob.status).toBe("failed");
    expect(importJob.failureReason).toContain("simulated failure");
  });

  it("lists import jobs for a store", async () => {
    const module = createMemoryDataTransferModule();

    await module.dataTransferService.createImportJob(
      validCreateImportJobInput({ type: "customers" }),
    );
    await module.dataTransferService.createImportJob(
      validCreateImportJobInput({ type: "products" }),
    );

    const result = await module.dataTransferService.listImportJobs({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("filters import jobs by status", async () => {
    const module = createMemoryDataTransferModule();

    await module.dataTransferService.createImportJob(validCreateImportJobInput());
    await module.dataTransferService.createImportJob(
      validCreateImportJobInput({ metadata: { simulateFailure: true } }),
    );

    const completed = await module.dataTransferService.listImportJobs({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      status: "completed",
    });

    const failed = await module.dataTransferService.listImportJobs({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      status: "failed",
    });

    expect(completed.items).toHaveLength(1);
    expect(failed.items).toHaveLength(1);
  });

  it("retrieves import job status by id", async () => {
    const module = createMemoryDataTransferModule();

    const created = await module.dataTransferService.createImportJob(
      validCreateImportJobInput(),
    );

    const importJob = await module.dataTransferService.getImportJob(
      TEST_STORE_A_ID,
      created.id,
    );

    expect(importJob.id).toBe(created.id);
    expect(importJob.status).toBe("completed");
  });

  it("returns not found for unknown import jobs", async () => {
    const module = createMemoryDataTransferModule();

    await expect(
      module.dataTransferService.getImportJob(
        TEST_STORE_A_ID,
        "99999999-9999-9999-9999-999999999999",
      ),
    ).rejects.toMatchObject({
      code: DATA_TRANSFER_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("isolates import jobs by store", async () => {
    const module = createMemoryDataTransferModule();

    await module.dataTransferService.createImportJob(
      validCreateImportJobInput({ storeId: TEST_STORE_A_ID }),
    );
    const storeBJob = await module.dataTransferService.createImportJob(
      validCreateImportJobInput({ storeId: TEST_STORE_B_ID }),
    );

    await expect(
      module.dataTransferService.getImportJob(TEST_STORE_A_ID, storeBJob.id),
    ).rejects.toMatchObject({
      code: DATA_TRANSFER_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("isolates export jobs by store", async () => {
    const module = createMemoryDataTransferModule();

    const storeBJob = await module.dataTransferService.createExportJob(
      validCreateExportJobInput({ storeId: TEST_STORE_B_ID }),
    );

    await expect(
      module.dataTransferService.getExportJob(TEST_STORE_A_ID, storeBJob.id),
    ).rejects.toMatchObject({
      code: DATA_TRANSFER_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });
});

describe("createImportJobSchema", () => {
  it("rejects invalid transfer types", () => {
    expect(
      createImportJobSchema.safeParse({
        storeId: TEST_STORE_A_ID,
        type: "orders",
      }).success,
    ).toBe(false);
  });
});
