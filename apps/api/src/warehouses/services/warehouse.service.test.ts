import { describe, expect, it } from "vitest";

import { WAREHOUSE_ERROR_CODES } from "../errors";
import {
  createMemoryWarehouseModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validWarehouseInput,
} from "../testing/warehouse-test-utils";

describe("WarehouseService", () => {
  it("creates a warehouse and makes the first one default", async () => {
    const module = createMemoryWarehouseModule();
    const warehouse = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "WH1" }),
    );

    expect(warehouse.isDefault).toBe(true);
    expect(warehouse.status).toBe("active");
    expect(warehouse.code).toBe("WH1");
  });

  it("creates additional non-default warehouses", async () => {
    const module = createMemoryWarehouseModule();
    await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "WH1" }),
    );
    const second = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "WH2", name: "Secondary Warehouse" }),
    );

    expect(second.isDefault).toBe(false);
    expect(second.name).toBe("Secondary Warehouse");
  });

  it("rejects creating a default warehouse as inactive", async () => {
    const module = createMemoryWarehouseModule();

    await expect(
      module.warehouseService.createWarehouse(
        validWarehouseInput({ isDefault: true, status: "inactive" }),
      ),
    ).rejects.toMatchObject({
      code: WAREHOUSE_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  });

  it("rejects creating the first warehouse as inactive", async () => {
    const module = createMemoryWarehouseModule();

    await expect(
      module.warehouseService.createWarehouse(
        validWarehouseInput({ status: "inactive" }),
      ),
    ).rejects.toMatchObject({
      code: WAREHOUSE_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  });

  it("enforces code uniqueness per store", async () => {
    const module = createMemoryWarehouseModule();
    await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "SHARED" }),
    );

    await expect(
      module.warehouseService.createWarehouse(
        validWarehouseInput({ code: "SHARED", name: "Duplicate Code" }),
      ),
    ).rejects.toMatchObject({
      code: WAREHOUSE_ERROR_CODES.CODE_ALREADY_EXISTS,
      status: 409,
    });
  });

  it("switches the default warehouse on update", async () => {
    const module = createMemoryWarehouseModule();
    const primary = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "PRIMARY" }),
    );
    const secondary = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "SECONDARY", name: "Secondary" }),
    );

    const updated = await module.warehouseService.updateWarehouse(
      TEST_STORE_A_ID,
      secondary.id,
      { isDefault: true },
    );
    const refreshedPrimary = await module.warehouseService.getWarehouse(
      TEST_STORE_A_ID,
      primary.id,
    );

    expect(updated.isDefault).toBe(true);
    expect(refreshedPrimary.isDefault).toBe(false);
  });

  it("rejects unsetting the default warehouse", async () => {
    const module = createMemoryWarehouseModule();
    const warehouse = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "ONLY" }),
    );

    await expect(
      module.warehouseService.updateWarehouse(TEST_STORE_A_ID, warehouse.id, {
        isDefault: false,
      }),
    ).rejects.toMatchObject({
      code: WAREHOUSE_ERROR_CODES.DEFAULT_WAREHOUSE_REQUIRED,
      status: 409,
    });
  });

  it("activates and deactivates non-default warehouses", async () => {
    const module = createMemoryWarehouseModule();
    await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "DEFAULT" }),
    );
    const secondary = await module.warehouseService.createWarehouse(
      validWarehouseInput({
        code: "SECONDARY",
        status: "inactive",
      }),
    );

    const activated = await module.warehouseService.activateWarehouse(
      TEST_STORE_A_ID,
      secondary.id,
    );
    expect(activated.status).toBe("active");

    const deactivated = await module.warehouseService.deactivateWarehouse(
      TEST_STORE_A_ID,
      secondary.id,
    );
    expect(deactivated.status).toBe("inactive");
  });

  it("rejects deactivating the default warehouse", async () => {
    const module = createMemoryWarehouseModule();
    const warehouse = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "DEFAULT" }),
    );

    await expect(
      module.warehouseService.deactivateWarehouse(TEST_STORE_A_ID, warehouse.id),
    ).rejects.toMatchObject({
      code: WAREHOUSE_ERROR_CODES.CANNOT_DEACTIVATE_DEFAULT,
      status: 409,
    });
  });

  it("rejects deleting the default warehouse", async () => {
    const module = createMemoryWarehouseModule();
    const warehouse = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "DEFAULT" }),
    );

    await expect(
      module.warehouseService.softDeleteWarehouse(TEST_STORE_A_ID, warehouse.id),
    ).rejects.toMatchObject({
      code: WAREHOUSE_ERROR_CODES.CANNOT_DELETE_DEFAULT,
      status: 409,
    });
  });

  it("soft deletes non-default warehouses", async () => {
    const module = createMemoryWarehouseModule();
    await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "DEFAULT" }),
    );
    const secondary = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "SECONDARY" }),
    );

    await module.warehouseService.softDeleteWarehouse(
      TEST_STORE_A_ID,
      secondary.id,
    );

    await expect(
      module.warehouseService.getWarehouse(TEST_STORE_A_ID, secondary.id),
    ).rejects.toMatchObject({
      code: WAREHOUSE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("isolates warehouses by store", async () => {
    const module = createMemoryWarehouseModule();
    const warehouse = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "STORE_A" }),
    );

    await expect(
      module.warehouseService.getWarehouse(TEST_STORE_B_ID, warehouse.id),
    ).rejects.toMatchObject({
      code: WAREHOUSE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("rolls back when update transaction fails", async () => {
    const module = createMemoryWarehouseModule();
    await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "DEFAULT" }),
    );
    const secondary = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "SECONDARY" }),
    );

    module.warehouseRepository.setTransactionFailure(new Error("db failure"));

    await expect(
      module.warehouseService.updateWarehouse(TEST_STORE_A_ID, secondary.id, {
        isDefault: true,
      }),
    ).rejects.toMatchObject({
      code: WAREHOUSE_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const unchanged = await module.warehouseService.getWarehouse(
      TEST_STORE_A_ID,
      secondary.id,
    );
    expect(unchanged.isDefault).toBe(false);
  });
});
