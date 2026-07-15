import { describe, expect, it } from "vitest";

import { SHIPPING_ZONE_ERROR_CODES } from "../errors";
import {
  createMemoryShippingConfigurationModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validShippingMethodInput,
  validShippingZoneInput,
} from "../testing/shipping-configuration-test-utils";

describe("ShippingZoneService", () => {
  it("creates, lists, gets, updates, and deletes a shipping zone", async () => {
    const module = createMemoryShippingConfigurationModule();
    const input = validShippingZoneInput();

    const created = await module.shippingZoneService.createShippingZone(input);
    expect(created.countries).toEqual(["US", "CA"]);
    expect(created.status).toBe("inactive");

    const listed = await module.shippingZoneService.listShippingZones({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(1);

    const fetched = await module.shippingZoneService.getShippingZone(
      TEST_STORE_A_ID,
      created.id,
    );
    expect(fetched.name).toBe(input.name);

    const updated = await module.shippingZoneService.updateShippingZone(
      TEST_STORE_A_ID,
      created.id,
      { name: "Updated Zone" },
    );
    expect(updated.name).toBe("Updated Zone");

    const deleted = await module.shippingZoneService.softDeleteShippingZone(
      TEST_STORE_A_ID,
      created.id,
    );
    expect(deleted.id).toBe(created.id);

    await expect(
      module.shippingZoneService.getShippingZone(TEST_STORE_A_ID, created.id),
    ).rejects.toMatchObject({
      code: SHIPPING_ZONE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("rejects deleting a zone with active methods", async () => {
    const module = createMemoryShippingConfigurationModule();
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput({ status: "active" }),
    );

    await module.shippingMethodService.createShippingMethod(
      validShippingMethodInput(zone.id, { status: "active" }),
    );

    await expect(
      module.shippingZoneService.softDeleteShippingZone(TEST_STORE_A_ID, zone.id),
    ).rejects.toMatchObject({
      code: SHIPPING_ZONE_ERROR_CODES.HAS_ACTIVE_METHODS,
      status: 409,
    });
  });

  it("rejects deactivating a zone with active methods", async () => {
    const module = createMemoryShippingConfigurationModule();
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput({ status: "active" }),
    );

    await module.shippingMethodService.createShippingMethod(
      validShippingMethodInput(zone.id, { status: "active" }),
    );

    await expect(
      module.shippingZoneService.updateShippingZone(TEST_STORE_A_ID, zone.id, {
        status: "inactive",
      }),
    ).rejects.toMatchObject({
      code: SHIPPING_ZONE_ERROR_CODES.HAS_ACTIVE_METHODS,
      status: 409,
    });
  });

  it("isolates shipping zones by store", async () => {
    const module = createMemoryShippingConfigurationModule();
    const created = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput(),
    );

    await expect(
      module.shippingZoneService.getShippingZone(TEST_STORE_B_ID, created.id),
    ).rejects.toMatchObject({
      code: SHIPPING_ZONE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });
});
