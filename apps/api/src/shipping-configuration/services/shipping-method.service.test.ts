import { describe, expect, it } from "vitest";

import { SHIPPING_METHOD_ERROR_CODES } from "../errors";
import {
  createMemoryShippingConfigurationModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validShippingMethodInput,
  validShippingZoneInput,
} from "../testing/shipping-configuration-test-utils";

describe("ShippingMethodService", () => {
  it("creates, lists, gets, updates, and deletes a shipping method", async () => {
    const module = createMemoryShippingConfigurationModule();
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput({ status: "active" }),
    );
    const input = validShippingMethodInput(zone.id);

    const created = await module.shippingMethodService.createShippingMethod(input);
    expect(created.flatRate).toBe("9.99");
    expect(created.status).toBe("inactive");

    const listed = await module.shippingMethodService.listShippingMethods({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(1);

    const fetched = await module.shippingMethodService.getShippingMethod(
      TEST_STORE_A_ID,
      created.id,
    );
    expect(fetched.name).toBe(input.name);

    const updated = await module.shippingMethodService.updateShippingMethod(
      TEST_STORE_A_ID,
      created.id,
      { name: "Express" },
    );
    expect(updated.name).toBe("Express");

    const deleted = await module.shippingMethodService.softDeleteShippingMethod(
      TEST_STORE_A_ID,
      created.id,
    );
    expect(deleted.id).toBe(created.id);

    await expect(
      module.shippingMethodService.getShippingMethod(
        TEST_STORE_A_ID,
        created.id,
      ),
    ).rejects.toMatchObject({
      code: SHIPPING_METHOD_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("rejects active methods when zone is inactive", async () => {
    const module = createMemoryShippingConfigurationModule();
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput({ status: "inactive" }),
    );

    await expect(
      module.shippingMethodService.createShippingMethod(
        validShippingMethodInput(zone.id, { status: "active" }),
      ),
    ).rejects.toMatchObject({
      code: SHIPPING_METHOD_ERROR_CODES.INACTIVE_ZONE_REQUIRED,
      status: 409,
    });
  });

  it("rejects negative flat rates", async () => {
    const module = createMemoryShippingConfigurationModule();
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput({ status: "active" }),
    );

    await expect(
      module.shippingMethodService.createShippingMethod(
        validShippingMethodInput(zone.id, { flatRate: "-1.00" }),
      ),
    ).rejects.toMatchObject({
      code: SHIPPING_METHOD_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  });

  it("allows zero flat rate", async () => {
    const module = createMemoryShippingConfigurationModule();
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput({ status: "active" }),
    );

    const method = await module.shippingMethodService.createShippingMethod(
      validShippingMethodInput(zone.id, { flatRate: "0" }),
    );

    expect(method.flatRate).toBe("0");
  });

  it("isolates shipping methods by store", async () => {
    const module = createMemoryShippingConfigurationModule();
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput({ status: "active" }),
    );
    const created = await module.shippingMethodService.createShippingMethod(
      validShippingMethodInput(zone.id),
    );

    await expect(
      module.shippingMethodService.getShippingMethod(
        TEST_STORE_B_ID,
        created.id,
      ),
    ).rejects.toMatchObject({
      code: SHIPPING_METHOD_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });
});
