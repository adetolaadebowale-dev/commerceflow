import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryDataTransferModule,
  validCreateExportJobInput,
  validCreateImportJobInput,
} from "../testing/data-transfer-test-utils";

describe("DataTransferService domain events", () => {
  it("emits import.created and import.completed for successful imports", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const createdHandler = vi.fn();
    const completedHandler = vi.fn();
    dispatcher.subscribe("import.created", createdHandler);
    dispatcher.subscribe("import.completed", completedHandler);

    const module = createMemoryDataTransferModule({
      domainEventPublisher: publisher,
    });

    const importJob = await module.dataTransferService.createImportJob(
      validCreateImportJobInput(),
    );

    await vi.waitFor(() => {
      expect(createdHandler).toHaveBeenCalledOnce();
      expect(completedHandler).toHaveBeenCalledOnce();
    });

    expect(createdHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "import.created",
      aggregateType: "import",
      aggregateId: importJob.id,
    });

    expect(completedHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "import.completed",
      aggregateId: importJob.id,
    });
  });

  it("emits import.failed when processing fails", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const failedHandler = vi.fn();
    dispatcher.subscribe("import.failed", failedHandler);

    const module = createMemoryDataTransferModule({
      domainEventPublisher: publisher,
    });

    await module.dataTransferService.createImportJob(
      validCreateImportJobInput({ metadata: { simulateFailure: true } }),
    );

    await vi.waitFor(() => {
      expect(failedHandler).toHaveBeenCalledOnce();
    });

    expect(failedHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "import.failed",
      aggregateType: "import",
    });
  });

  it("emits export.created and export.completed for successful exports", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const createdHandler = vi.fn();
    const completedHandler = vi.fn();
    dispatcher.subscribe("export.created", createdHandler);
    dispatcher.subscribe("export.completed", completedHandler);

    const module = createMemoryDataTransferModule({
      domainEventPublisher: publisher,
    });

    const exportJob = await module.dataTransferService.createExportJob(
      validCreateExportJobInput(),
    );

    await vi.waitFor(() => {
      expect(createdHandler).toHaveBeenCalledOnce();
      expect(completedHandler).toHaveBeenCalledOnce();
    });

    expect(createdHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "export.created",
      aggregateId: exportJob.id,
    });
  });
});
