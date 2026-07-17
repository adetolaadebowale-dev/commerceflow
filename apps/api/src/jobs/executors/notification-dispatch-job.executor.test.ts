import { describe, expect, it } from "vitest";

import {
  createMemoryNotificationModule,
  TEST_STORE_A_ID,
  validNotificationInput,
} from "@/notifications/testing/notification-test-utils";

import { JOB_SIMULATE_FAILURE_KEY } from "./job-executor";
import { NotificationDispatchJobExecutor } from "./notification-dispatch-job.executor";

describe("NotificationDispatchJobExecutor", () => {
  it("creates a notification from the job payload", async () => {
    const module = createMemoryNotificationModule();
    const executor = new NotificationDispatchJobExecutor(async () =>
      module.notificationService,
    );

    const result = await executor.execute({
      id: "job-id",
      storeId: TEST_STORE_A_ID,
      type: "notification.dispatch",
      status: "pending",
      payload: {
        notificationInput: validNotificationInput({
          subject: "Deferred notification",
          body: "Created by background job.",
        }),
        sourceEventType: "shipment.shipped",
        sourceAggregateId: "shipment-id",
      },
      scheduledFor: "2026-07-16T00:00:00.000Z",
      createdAt: "2026-07-16T00:00:00.000Z",
      updatedAt: "2026-07-16T00:00:00.000Z",
    });

    expect(result.success).toBe(true);

    const notifications = await module.notificationService.listNotifications({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });
    expect(notifications.total).toBe(1);
    expect(notifications.items[0]?.subject).toBe("Deferred notification");
  });

  it("returns failure when notificationInput is missing", async () => {
    const executor = new NotificationDispatchJobExecutor(async () => {
      throw new Error("should not be called");
    });

    const result = await executor.execute({
      id: "job-id",
      storeId: TEST_STORE_A_ID,
      type: "notification.dispatch",
      status: "pending",
      payload: {},
      scheduledFor: "2026-07-16T00:00:00.000Z",
      createdAt: "2026-07-16T00:00:00.000Z",
      updatedAt: "2026-07-16T00:00:00.000Z",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("notificationInput");
  });

  it("simulates failure when requested in payload", async () => {
    const executor = new NotificationDispatchJobExecutor(async () => {
      throw new Error("should not be called");
    });

    const result = await executor.execute({
      id: "job-id",
      storeId: TEST_STORE_A_ID,
      type: "notification.dispatch",
      status: "pending",
      payload: { [JOB_SIMULATE_FAILURE_KEY]: true },
      scheduledFor: "2026-07-16T00:00:00.000Z",
      createdAt: "2026-07-16T00:00:00.000Z",
      updatedAt: "2026-07-16T00:00:00.000Z",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Simulated job failure");
  });
});
