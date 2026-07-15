import { describe, expect, it } from "vitest";

import { TAX_RATE_ERROR_CODES } from "../errors";
import {
  createMemoryTaxRateModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validTaxRateInput,
} from "../testing/tax-rate-test-utils";

describe("TaxRateService", () => {
  it("creates an inactive tax rate", async () => {
    const module = createMemoryTaxRateModule();
    const taxRate = await module.taxRateService.createTaxRate(
      validTaxRateInput({ percentage: "10" }),
    );

    expect(taxRate.status).toBe("inactive");
    expect(taxRate.percentage).toBe("10");
    expect(taxRate.name).toBe("Standard Sales Tax");
  });

  it("rejects percentages outside 0 to 100", async () => {
    const module = createMemoryTaxRateModule();

    await expect(
      module.taxRateService.createTaxRate(
        validTaxRateInput({ percentage: "100.01" }),
      ),
    ).rejects.toMatchObject({
      code: TAX_RATE_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  });

  it("allows only one active tax rate per store", async () => {
    const module = createMemoryTaxRateModule();
    const first = await module.taxRateService.createTaxRate(
      validTaxRateInput({ name: "Rate A", percentage: "5" }),
    );
    await module.taxRateService.activateTaxRate(TEST_STORE_A_ID, first.id);

    const second = await module.taxRateService.createTaxRate(
      validTaxRateInput({ name: "Rate B", percentage: "7" }),
    );

    await expect(
      module.taxRateService.activateTaxRate(TEST_STORE_A_ID, second.id),
    ).resolves.toMatchObject({ status: "active" });

    const rates = await module.taxRateService.listTaxRates({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    const activeRates = rates.items.filter((rate) => rate.status === "active");
    expect(activeRates).toHaveLength(1);
    expect(activeRates[0]?.id).toBe(second.id);
  });

  it("activates and deactivates tax rates", async () => {
    const module = createMemoryTaxRateModule();
    const taxRate = await module.taxRateService.createTaxRate(validTaxRateInput());

    const activated = await module.taxRateService.activateTaxRate(
      TEST_STORE_A_ID,
      taxRate.id,
    );
    expect(activated.status).toBe("active");

    const deactivated = await module.taxRateService.deactivateTaxRate(
      TEST_STORE_A_ID,
      taxRate.id,
    );
    expect(deactivated.status).toBe("inactive");
  });

  it("isolates tax rates by store", async () => {
    const module = createMemoryTaxRateModule();
    const taxRate = await module.taxRateService.createTaxRate(validTaxRateInput());

    await expect(
      module.taxRateService.getTaxRate(TEST_STORE_B_ID, taxRate.id),
    ).rejects.toMatchObject({
      code: TAX_RATE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("rolls back when activation transaction fails", async () => {
    const module = createMemoryTaxRateModule();
    const taxRate = await module.taxRateService.createTaxRate(validTaxRateInput());

    module.taxRateRepository.setTransactionFailure(new Error("db failure"));

    await expect(
      module.taxRateService.activateTaxRate(TEST_STORE_A_ID, taxRate.id),
    ).rejects.toMatchObject({
      code: TAX_RATE_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const unchanged = await module.taxRateService.getTaxRate(
      TEST_STORE_A_ID,
      taxRate.id,
    );
    expect(unchanged.status).toBe("inactive");
  });
});
