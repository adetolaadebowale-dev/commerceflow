import { describe, expect, it } from "vitest";

import { SHIPMENT_ERROR_CODES } from "../errors";
import {
  createMemoryShipmentModule,
  createPackedShipment,
  createPendingShipment,
  createShippedShipment,
  seedFulfilledOrderWithShipping,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validShipmentInput,
} from "../testing/shipment-test-utils";

describe("ShipmentService", () => {
  it("creates a pending shipment that snapshots order shipping address", async () => {
    const module = createMemoryShipmentModule();
    const { order } = await seedFulfilledOrderWithShipping(module);

    const shipment = await module.shipmentService.createShipment(
      TEST_STORE_A_ID,
      order.id,
      validShipmentInput({
        carrier: "manual",
        trackingNumber: "TRACK-001",
      }),
    );

    expect(shipment.status).toBe("pending");
    expect(shipment.orderId).toBe(order.id);
    expect(shipment.shipmentNumber).toMatch(/^SHP-/);
    expect(shipment.carrier).toBe("manual");
    expect(shipment.trackingNumber).toBe("TRACK-001");
    expect(shipment.shippingRecipientName).toBe("Jane Doe");
    expect(shipment.shippingAddressLine1).toBe("123 Main St");
    expect(shipment.shippingCity).toBe("Springfield");
    expect(shipment.shippingCountryCode).toBe("US");
  });

  it("rejects shipment creation when order is not fulfilled", async () => {
    const module = createMemoryShipmentModule();
    const { confirmed } = await import(
      "@/fulfillment/testing/fulfillment-test-utils"
    ).then((m) => m.seedConfirmedReservedOrder(module));

    await expect(
      module.shipmentService.createShipment(
        TEST_STORE_A_ID,
        confirmed.id,
        validShipmentInput(),
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_ERROR_CODES.ORDER_NOT_FULFILLED,
      status: 409,
    });
  });

  it("rejects shipment creation when order lacks shipping address", async () => {
    const module = createMemoryShipmentModule();
    const { confirmed } = await import(
      "@/fulfillment/testing/fulfillment-test-utils"
    ).then((m) => m.seedConfirmedReservedOrder(module));

    await module.fulfillmentService.fulfillOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    await expect(
      module.shipmentService.createShipment(
        TEST_STORE_A_ID,
        confirmed.id,
        validShipmentInput(),
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_ERROR_CODES.SHIPPING_ADDRESS_INCOMPLETE,
      status: 409,
    });
  });

  it("rejects a second shipment for the same order", async () => {
    const module = createMemoryShipmentModule();
    const { order } = await createPendingShipment(module);

    await expect(
      module.shipmentService.createShipment(
        TEST_STORE_A_ID,
        order.id,
        validShipmentInput(),
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_ERROR_CODES.ALREADY_EXISTS,
      status: 409,
    });
  });

  it("transitions shipment through pack, ship, and deliver lifecycle", async () => {
    const module = createMemoryShipmentModule();
    const { shipment: pending } = await createPendingShipment(module);

    const packed = await module.shipmentService.packShipment(
      { storeId: TEST_STORE_A_ID },
      pending.id,
    );
    expect(packed.status).toBe("packed");

    const shipped = await module.shipmentService.shipShipment(
      { storeId: TEST_STORE_A_ID },
      packed.id,
    );
    expect(shipped.status).toBe("shipped");
    expect(shipped.shippedAt).toBeTruthy();

    const delivered = await module.shipmentService.deliverShipment(
      { storeId: TEST_STORE_A_ID },
      shipped.id,
    );
    expect(delivered.status).toBe("delivered");
    expect(delivered.deliveredAt).toBeTruthy();
  });

  it("keeps shipping address immutable after lifecycle transitions", async () => {
    const module = createMemoryShipmentModule();
    const { order, shipment: pending } = await createPendingShipment(module);

    const delivered = await module.shipmentService.deliverShipment(
      { storeId: TEST_STORE_A_ID },
      (
        await module.shipmentService.shipShipment(
          { storeId: TEST_STORE_A_ID },
          (
            await module.shipmentService.packShipment(
              { storeId: TEST_STORE_A_ID },
              pending.id,
            )
          ).id,
        )
      ).id,
    );

    expect(delivered.shippingRecipientName).toBe(
      order.shippingAddress?.recipientName,
    );
    expect(delivered.shippingAddressLine1).toBe(
      order.shippingAddress?.addressLine1,
    );
    expect(delivered.shipmentNumber).toBe(pending.shipmentNumber);
  });

  it("allows cancellation from pending", async () => {
    const module = createMemoryShipmentModule();
    const { shipment: pending } = await createPendingShipment(module);

    const cancelledFromPending = await module.shipmentService.cancelShipment(
      { storeId: TEST_STORE_A_ID },
      pending.id,
    );
    expect(cancelledFromPending.status).toBe("cancelled");
  });

  it("allows cancellation from packed", async () => {
    const module = createMemoryShipmentModule();
    const { shipment: packedSource } = await createPackedShipment(module);

    const cancelledFromPacked = await module.shipmentService.cancelShipment(
      { storeId: TEST_STORE_A_ID },
      packedSource.id,
    );
    expect(cancelledFromPacked.status).toBe("cancelled");
  });

  it("rejects invalid lifecycle transitions", async () => {
    const module = createMemoryShipmentModule();
    const { shipment } = await createShippedShipment(module);

    await expect(
      module.shipmentService.cancelShipment(
        { storeId: TEST_STORE_A_ID },
        shipment.id,
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_ERROR_CODES.INVALID_TRANSITION,
      status: 409,
    });
  });

  it("scopes shipment lookup by store", async () => {
    const module = createMemoryShipmentModule();
    const { shipment } = await createPendingShipment(module);

    await expect(
      module.shipmentService.getShipment(TEST_STORE_B_ID, shipment.id),
    ).rejects.toMatchObject({
      code: SHIPMENT_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("lists shipments for an order", async () => {
    const module = createMemoryShipmentModule();
    const { order, shipment } = await createPendingShipment(module);

    const shipments = await module.shipmentService.listOrderShipments(
      { storeId: TEST_STORE_A_ID },
      order.id,
    );

    expect(shipments).toHaveLength(1);
    expect(shipments[0]?.id).toBe(shipment.id);
  });
});
