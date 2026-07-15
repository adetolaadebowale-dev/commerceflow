import { describe, expect, it } from "vitest";

import { SHIPMENT_PACKAGE_ERROR_CODES } from "../errors";
import {
  createMemoryShipmentPackageModule,
  seedPendingShipmentWithPackage,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validPackageInput,
} from "../testing/shipment-package-test-utils";
import { createPendingShipment } from "@/shipments/testing/shipment-test-utils";

describe("ShipmentPackageService", () => {
  it("creates a package with auto-generated package number", async () => {
    const module = createMemoryShipmentPackageModule();
    const { shipment } = await createPendingShipment(module);

    const shipmentPackage = await module.shipmentPackageService.createPackage(
      TEST_STORE_A_ID,
      shipment.id,
      validPackageInput({ trackingNumber: "PKG-TRACK-001" }),
    );

    expect(shipmentPackage.shipmentId).toBe(shipment.id);
    expect(shipmentPackage.storeId).toBe(TEST_STORE_A_ID);
    expect(shipmentPackage.packageNumber).toMatch(/^PKG-/);
    expect(shipmentPackage.weight).toBe("2.5");
    expect(shipmentPackage.trackingNumber).toBe("PKG-TRACK-001");
  });

  it("supports multiple packages on one shipment", async () => {
    const module = createMemoryShipmentPackageModule();
    const { shipment } = await createPendingShipment(module);

    const first = await module.shipmentPackageService.createPackage(
      TEST_STORE_A_ID,
      shipment.id,
      validPackageInput({ weight: "1.0" }),
    );
    const second = await module.shipmentPackageService.createPackage(
      TEST_STORE_A_ID,
      shipment.id,
      validPackageInput({ weight: "3.0" }),
    );

    const packages = await module.shipmentPackageService.listPackages(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    expect(packages).toHaveLength(2);
    expect(packages.map((pkg) => pkg.id).sort()).toEqual(
      [first.id, second.id].sort(),
    );
    expect(first.packageNumber).not.toBe(second.packageNumber);
  });

  it("lists, gets, updates, and deletes packages", async () => {
    const module = createMemoryShipmentPackageModule();
    const { shipment, shipmentPackage } =
      await seedPendingShipmentWithPackage(module);

    const fetched = await module.shipmentPackageService.getPackage(
      TEST_STORE_A_ID,
      shipmentPackage.id,
    );
    expect(fetched.id).toBe(shipmentPackage.id);

    const updated = await module.shipmentPackageService.updatePackage(
      TEST_STORE_A_ID,
      shipmentPackage.id,
      { weight: "5.0", trackingNumber: "UPDATED-TRACK" },
    );
    expect(updated.weight).toBe("5.0");
    expect(updated.trackingNumber).toBe("UPDATED-TRACK");

    const deleted = await module.shipmentPackageService.deletePackage(
      TEST_STORE_A_ID,
      shipmentPackage.id,
    );
    expect(deleted.id).toBe(shipmentPackage.id);

    const remaining = await module.shipmentPackageService.listPackages(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );
    expect(remaining).toHaveLength(0);
  });

  it("rejects package mutations when shipment is missing", async () => {
    const module = createMemoryShipmentPackageModule();

    await expect(
      module.shipmentPackageService.createPackage(
        TEST_STORE_A_ID,
        "99999999-9999-9999-9999-999999999999",
        validPackageInput(),
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_PACKAGE_ERROR_CODES.SHIPMENT_NOT_FOUND,
      status: 404,
    });
  });

  it("rejects package mutations on delivered shipments", async () => {
    const module = createMemoryShipmentPackageModule();
    const { shipment } = await createPendingShipment(module);

    await module.shipmentService.packShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );
    await module.shipmentService.shipShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );
    await module.shipmentService.deliverShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    await expect(
      module.shipmentPackageService.createPackage(
        TEST_STORE_A_ID,
        shipment.id,
        validPackageInput(),
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_PACKAGE_ERROR_CODES.SHIPMENT_NOT_MUTABLE,
      status: 409,
    });
  });

  it("rejects package mutations on cancelled shipments", async () => {
    const module = createMemoryShipmentPackageModule();
    const { shipment } = await createPendingShipment(module);

    await module.shipmentService.cancelShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    await expect(
      module.shipmentPackageService.createPackage(
        TEST_STORE_A_ID,
        shipment.id,
        validPackageInput(),
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_PACKAGE_ERROR_CODES.SHIPMENT_NOT_MUTABLE,
      status: 409,
    });
  });

  it("isolates packages by store", async () => {
    const module = createMemoryShipmentPackageModule();
    const { shipment, shipmentPackage } =
      await seedPendingShipmentWithPackage(module);

    await expect(
      module.shipmentPackageService.getPackage(
        TEST_STORE_B_ID,
        shipmentPackage.id,
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_PACKAGE_ERROR_CODES.PACKAGE_NOT_FOUND,
      status: 404,
    });

    await expect(
      module.shipmentPackageService.listPackages(
        { storeId: TEST_STORE_B_ID },
        shipment.id,
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_PACKAGE_ERROR_CODES.SHIPMENT_NOT_FOUND,
      status: 404,
    });
  });

  it("rolls back when the repository transaction fails", async () => {
    const module = createMemoryShipmentPackageModule();
    const { shipment } = await createPendingShipment(module);
    module.shipmentPackageRepository.setTransactionFailure(
      new Error("db failure"),
    );

    await expect(
      module.shipmentPackageService.createPackage(
        TEST_STORE_A_ID,
        shipment.id,
        validPackageInput(),
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_PACKAGE_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    module.shipmentPackageRepository.setTransactionFailure(null);

    const packages = await module.shipmentPackageService.listPackages(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );
    expect(packages).toHaveLength(0);
  });
});
