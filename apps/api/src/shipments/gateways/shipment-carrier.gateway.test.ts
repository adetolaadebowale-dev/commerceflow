import { describe, expect, it } from "vitest";

import type {
  ShipmentCarrier,
  ShipmentCarrierGateway,
  ShipmentDispatchContext,
  ShipmentInitializeRequest,
} from "@commerceflow/types";

import { InternalShipmentCarrierGateway } from "./internal-shipment-carrier.gateway";
import { ManualShipmentCarrierGateway } from "./manual-shipment-carrier.gateway";
import {
  DefaultShipmentCarrierGatewayFactory,
  type ShipmentCarrierGatewayFactory,
} from "./shipment-carrier-gateway.factory";

describe("InternalShipmentCarrierGateway", () => {
  const gateway = new InternalShipmentCarrierGateway();

  const initializeRequest: ShipmentInitializeRequest = {
    storeId: "11111111-1111-1111-1111-111111111111",
    orderId: "22222222-2222-2222-2222-222222222222",
    shipmentNumber: "SHP-20260715-ABCDEF01",
    carrier: "internal",
    shippingRecipientName: "Jane Doe",
    shippingPhone: "+15551234567",
    shippingAddressLine1: "123 Main St",
    shippingCity: "Springfield",
    shippingStateProvince: "IL",
    shippingPostalCode: "62701",
    shippingCountryCode: "US",
  };

  const dispatchContext: ShipmentDispatchContext = {
    storeId: initializeRequest.storeId,
    orderId: initializeRequest.orderId,
    shipmentId: "33333333-3333-3333-3333-333333333333",
    shipmentNumber: initializeRequest.shipmentNumber,
    carrier: "internal",
    status: "packed",
    shippingRecipientName: initializeRequest.shippingRecipientName,
    shippingPhone: initializeRequest.shippingPhone,
    shippingAddressLine1: initializeRequest.shippingAddressLine1,
    shippingCity: initializeRequest.shippingCity,
    shippingStateProvince: initializeRequest.shippingStateProvince,
    shippingPostalCode: initializeRequest.shippingPostalCode,
    shippingCountryCode: initializeRequest.shippingCountryCode,
  };

  it("simulates successful initialize, dispatch, cancel, and verify", async () => {
    const initialized = await gateway.initializeShipment(initializeRequest);
    expect(initialized.success).toBe(true);
    expect(initialized.gatewayReference).toContain("INITIALIZE");

    const dispatched = await gateway.dispatchShipment(dispatchContext);
    expect(dispatched.success).toBe(true);
    expect(dispatched.trackingNumber).toMatch(/^INT-TRK-/);
    expect(dispatched.gatewayReference).toContain("DISPATCH");

    const cancelled = await gateway.cancelShipment({
      ...dispatchContext,
      status: "pending",
    });
    expect(cancelled.success).toBe(true);

    const verified = await gateway.verifyShipment({
      ...dispatchContext,
      status: "shipped",
      trackingNumber: dispatched.trackingNumber,
    });
    expect(verified.success).toBe(true);
  });

  it("simulates failure when simulateCarrierFailure metadata is set", async () => {
    const result = await gateway.initializeShipment({
      ...initializeRequest,
      metadata: { simulateCarrierFailure: true },
    });

    expect(result.success).toBe(false);
  });

  it("reports verify failure for non-dispatched statuses", async () => {
    const result = await gateway.verifyShipment({
      ...dispatchContext,
      status: "pending",
    });

    expect(result.success).toBe(false);
  });
});

describe("ManualShipmentCarrierGateway", () => {
  const gateway = new ManualShipmentCarrierGateway();

  const initializeRequest: ShipmentInitializeRequest = {
    storeId: "11111111-1111-1111-1111-111111111111",
    orderId: "22222222-2222-2222-2222-222222222222",
    shipmentNumber: "SHP-20260715-MANUAL01",
    carrier: "manual",
    trackingNumber: "MAN-TRACK-001",
    shippingRecipientName: "Jane Doe",
    shippingPhone: "+15551234567",
    shippingAddressLine1: "123 Main St",
    shippingCity: "Springfield",
    shippingStateProvince: "IL",
    shippingPostalCode: "62701",
    shippingCountryCode: "US",
  };

  const dispatchContext: ShipmentDispatchContext = {
    storeId: initializeRequest.storeId,
    orderId: initializeRequest.orderId,
    shipmentId: "33333333-3333-3333-3333-333333333333",
    shipmentNumber: initializeRequest.shipmentNumber,
    carrier: "manual",
    trackingNumber: initializeRequest.trackingNumber,
    status: "packed",
    shippingRecipientName: initializeRequest.shippingRecipientName,
    shippingPhone: initializeRequest.shippingPhone,
    shippingAddressLine1: initializeRequest.shippingAddressLine1,
    shippingCity: initializeRequest.shippingCity,
    shippingStateProvince: initializeRequest.shippingStateProvince,
    shippingPostalCode: initializeRequest.shippingPostalCode,
    shippingCountryCode: initializeRequest.shippingCountryCode,
  };

  it("accepts provided tracking number and simulates successful dispatch", async () => {
    const initialized = await gateway.initializeShipment(initializeRequest);
    expect(initialized.success).toBe(true);
    expect(initialized.trackingNumber).toBe("MAN-TRACK-001");

    const dispatched = await gateway.dispatchShipment(dispatchContext);
    expect(dispatched.success).toBe(true);
    expect(dispatched.trackingNumber).toBe("MAN-TRACK-001");
    expect(dispatched.gatewayReference).toContain("DISPATCH");
  });

  it("fails dispatch when tracking number is missing", async () => {
    const result = await gateway.dispatchShipment({
      ...dispatchContext,
      trackingNumber: undefined,
    });

    expect(result.success).toBe(false);
  });
});

describe("DefaultShipmentCarrierGatewayFactory", () => {
  function createFactory(
    gateways: ReadonlyMap<ShipmentCarrier, ShipmentCarrierGateway>,
  ): ShipmentCarrierGatewayFactory {
    return new DefaultShipmentCarrierGatewayFactory(gateways);
  }

  it("resolves internal and manual carriers", () => {
    const internal = new InternalShipmentCarrierGateway();
    const manual = new ManualShipmentCarrierGateway();
    const gateways = new Map<ShipmentCarrier, ShipmentCarrierGateway>([
      ["internal", internal],
      ["manual", manual],
    ]);
    const factory = createFactory(gateways);

    expect(factory.resolve("internal")).toBe(internal);
    expect(factory.resolve("manual")).toBe(manual);
  });

  it("throws for unsupported carriers", () => {
    const factory = createFactory(
      new Map([["internal", new InternalShipmentCarrierGateway()]]),
    );

    expect(() => factory.resolve("manual")).toThrow(/Unsupported shipment carrier/);
  });
});
