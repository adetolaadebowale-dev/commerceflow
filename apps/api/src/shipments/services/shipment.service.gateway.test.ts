import { describe, expect, it, vi } from "vitest";

import type {
  ShipmentCarrier,
  ShipmentCarrierGateway,
  ShipmentDispatchContext,
  ShipmentGatewayResult,
  ShipmentInitializeRequest,
} from "@commerceflow/types";

import { SHIPMENT_ERROR_CODES } from "../errors";
import {
  DefaultShipmentCarrierGatewayFactory,
  ManualShipmentCarrierGateway,
} from "../gateways";
import {
  createMemoryShipmentModule,
  createPackedShipment,
  createPendingShipment,
  seedFulfilledOrderWithShipping,
  TEST_STORE_A_ID,
  validShipmentInput,
} from "../testing/shipment-test-utils";

class StubShipmentCarrierGateway implements ShipmentCarrierGateway {
  readonly carrier: ShipmentCarrier;
  readonly operations: string[] = [];
  readonly failOperations = new Set<string>();

  constructor(carrier: ShipmentCarrier) {
    this.carrier = carrier;
  }

  fail(operation: string): void {
    this.failOperations.add(operation);
  }

  private result(
    operation: string,
    trackingNumber?: string,
  ): ShipmentGatewayResult {
    this.operations.push(operation);

    if (this.failOperations.has(operation)) {
      return {
        success: false,
        message: `${operation} failed in stub carrier gateway`,
      };
    }

    return {
      success: true,
      gatewayReference: `STUB-${operation.toUpperCase()}`,
      trackingNumber: trackingNumber ?? "STUB-TRACK-001",
    };
  }

  initializeShipment(_request: ShipmentInitializeRequest) {
    return Promise.resolve(this.result("initialize"));
  }

  dispatchShipment(_context: ShipmentDispatchContext) {
    return Promise.resolve(this.result("dispatch"));
  }

  verifyShipment(_context: ShipmentDispatchContext) {
    return Promise.resolve(this.result("verify"));
  }

  cancelShipment(_context: ShipmentDispatchContext) {
    return Promise.resolve(this.result("cancel"));
  }
}

function createGatewayBackedModule(stub: StubShipmentCarrierGateway) {
  return createMemoryShipmentModule({
    shipmentCarrierGatewayFactory: new DefaultShipmentCarrierGatewayFactory(
      new Map([[stub.carrier, stub]]),
    ),
  });
}

describe("ShipmentService gateway integration", () => {
  it("uses injected gateway during shipment creation", async () => {
    const stub = new StubShipmentCarrierGateway("internal");
    const module = createGatewayBackedModule(stub);
    const { order } = await seedFulfilledOrderWithShipping(module);

    await module.shipmentService.createShipment(
      TEST_STORE_A_ID,
      order.id,
      validShipmentInput(),
    );

    expect(stub.operations).toContain("initialize");
  });

  it("calls dispatch gateway operation during ship lifecycle", async () => {
    const stub = new StubShipmentCarrierGateway("internal");
    const module = createGatewayBackedModule(stub);
    const { shipment } = await createPackedShipment(module);
    stub.operations.length = 0;

    await module.shipmentService.shipShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    expect(stub.operations).toEqual(["dispatch"]);
  });

  it("calls cancel gateway operation during cancel lifecycle", async () => {
    const stub = new StubShipmentCarrierGateway("internal");
    const module = createGatewayBackedModule(stub);
    const { shipment } = await createPendingShipment(module);
    stub.operations.length = 0;

    await module.shipmentService.cancelShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    expect(stub.operations).toEqual(["cancel"]);
  });

  it("propagates gateway failures without persisting lifecycle transitions", async () => {
    const stub = new StubShipmentCarrierGateway("internal");
    stub.fail("dispatch");
    const module = createGatewayBackedModule(stub);
    const { shipment } = await createPackedShipment(module);

    await expect(
      module.shipmentService.shipShipment(
        { storeId: TEST_STORE_A_ID },
        shipment.id,
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_ERROR_CODES.CARRIER_ERROR,
      status: 502,
    });

    const unchanged = await module.shipmentService.getShipment(
      TEST_STORE_A_ID,
      shipment.id,
    );
    expect(unchanged.status).toBe("packed");
  });

  it("does not call gateway for pack or deliver transitions", async () => {
    const stub = new StubShipmentCarrierGateway("internal");
    const module = createGatewayBackedModule(stub);
    const { shipment } = await createPendingShipment(module);
    stub.operations.length = 0;

    const packed = await module.shipmentService.packShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );
    await module.shipmentService.shipShipment(
      { storeId: TEST_STORE_A_ID },
      packed.id,
    );
    stub.operations.length = 0;

    const shipped = await module.shipmentService.getShipment(
      TEST_STORE_A_ID,
      packed.id,
    );

    await module.shipmentService.deliverShipment(
      { storeId: TEST_STORE_A_ID },
      shipped.id,
    );

    expect(stub.operations).not.toContain("deliver");
    expect(stub.operations).toHaveLength(0);
  });

  it("resolves manual carrier through factory-backed service", async () => {
    const manualGateway = new ManualShipmentCarrierGateway();
    const initializeSpy = vi.spyOn(manualGateway, "initializeShipment");
    const module = createMemoryShipmentModule({
      shipmentCarrierGatewayFactory: new DefaultShipmentCarrierGatewayFactory(
        new Map([["manual", manualGateway]]),
      ),
    });
    const { order } = await seedFulfilledOrderWithShipping(module);

    await module.shipmentService.createShipment(
      TEST_STORE_A_ID,
      order.id,
      validShipmentInput({
        carrier: "manual",
        trackingNumber: "MAN-001",
      }),
    );

    expect(initializeSpy).toHaveBeenCalledOnce();
  });

  it("assigns synthetic tracking number from internal carrier on dispatch", async () => {
    const module = createMemoryShipmentModule();
    const { shipment } = await createPackedShipment(module);

    const shipped = await module.shipmentService.shipShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    expect(shipped.trackingNumber).toMatch(/^INT-TRK-/);
  });

  it("preserves manual tracking number through dispatch", async () => {
    const module = createMemoryShipmentModule();
    const { order } = await seedFulfilledOrderWithShipping(module);

    const pending = await module.shipmentService.createShipment(
      TEST_STORE_A_ID,
      order.id,
      validShipmentInput({
        carrier: "manual",
        trackingNumber: "MAN-TRACK-999",
      }),
    );

    const packed = await module.shipmentService.packShipment(
      { storeId: TEST_STORE_A_ID },
      pending.id,
    );

    const shipped = await module.shipmentService.shipShipment(
      { storeId: TEST_STORE_A_ID },
      packed.id,
    );

    expect(shipped.trackingNumber).toBe("MAN-TRACK-999");
  });
});
