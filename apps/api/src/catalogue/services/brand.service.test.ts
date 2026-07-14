import { describe, expect, it } from "vitest";

import { CATALOGUE_ERROR_CODES } from "../errors";
import {
  createMemoryBrandService,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validBrandInput,
} from "../testing/catalogue-test-utils";

describe("BrandService", () => {
  it("creates, lists, gets, and updates a brand", async () => {
    const { brandService } = createMemoryBrandService();
    const input = validBrandInput();

    const created = await brandService.createBrand(input);
    expect(created.slug).toBe(input.slug);
    expect(created.storeId).toBe(TEST_STORE_A_ID);

    const listed = await brandService.listBrands({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(1);
    expect(listed.totalPages).toBe(1);

    const fetched = await brandService.getBrand(TEST_STORE_A_ID, created.id);
    expect(fetched.name).toBe(input.name);

    const updated = await brandService.updateBrand(
      TEST_STORE_A_ID,
      created.id,
      { name: "Updated Acme" },
    );
    expect(updated.name).toBe("Updated Acme");
  });

  it("rejects duplicate brand slugs within the same store", async () => {
    const { brandService } = createMemoryBrandService();
    const input = validBrandInput();

    await brandService.createBrand(input);

    await expect(brandService.createBrand(input)).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.SLUG_ALREADY_EXISTS,
      status: 409,
    });
  });

  it("allows duplicate brand slugs across different stores", async () => {
    const { brandService } = createMemoryBrandService();
    const slug = `shared-brand-${crypto.randomUUID().slice(0, 8)}`;

    await brandService.createBrand(
      validBrandInput({ storeId: TEST_STORE_A_ID, slug }),
    );

    const created = await brandService.createBrand(
      validBrandInput({ storeId: TEST_STORE_B_ID, slug }),
    );

    expect(created.slug).toBe(slug);
  });

  it("soft deletes a brand and excludes it from queries", async () => {
    const { brandService } = createMemoryBrandService();
    const created = await brandService.createBrand(validBrandInput());

    const deleted = await brandService.deleteBrand(
      TEST_STORE_A_ID,
      created.id,
    );
    expect(deleted.id).toBe(created.id);

    await expect(
      brandService.getBrand(TEST_STORE_A_ID, created.id),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });

    const listed = await brandService.listBrands({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(0);

    await expect(
      brandService.updateBrand(TEST_STORE_A_ID, created.id, {
        name: "Should fail",
      }),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("isolates brands by store", async () => {
    const { brandService } = createMemoryBrandService();
    const brand = await brandService.createBrand(validBrandInput());

    await expect(
      brandService.getBrand(TEST_STORE_B_ID, brand.id),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("paginates brand lists", async () => {
    const { brandService } = createMemoryBrandService();

    for (let index = 0; index < 5; index += 1) {
      await brandService.createBrand(
        validBrandInput({ slug: `brand-${index}` }),
      );
    }

    const pageOne = await brandService.listBrands({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 2,
    });
    expect(pageOne.items).toHaveLength(2);
    expect(pageOne.total).toBe(5);
    expect(pageOne.totalPages).toBe(3);

    const pageThree = await brandService.listBrands({
      storeId: TEST_STORE_A_ID,
      page: 3,
      limit: 2,
    });
    expect(pageThree.items).toHaveLength(1);
  });

  it("allows reusing a slug after soft delete", async () => {
    const { brandService } = createMemoryBrandService();
    const slug = `reusable-slug-${crypto.randomUUID().slice(0, 8)}`;
    const created = await brandService.createBrand(validBrandInput({ slug }));

    await brandService.deleteBrand(TEST_STORE_A_ID, created.id);

    const recreated = await brandService.createBrand(validBrandInput({ slug }));
    expect(recreated.slug).toBe(slug);
  });

  it("rejects duplicate slug on update", async () => {
    const { brandService } = createMemoryBrandService();
    const first = await brandService.createBrand(
      validBrandInput({ slug: "first-brand" }),
    );
    const second = await brandService.createBrand(
      validBrandInput({ slug: "second-brand" }),
    );

    await expect(
      brandService.updateBrand(TEST_STORE_A_ID, second.id, {
        slug: first.slug,
      }),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.SLUG_ALREADY_EXISTS,
      status: 409,
    });
  });
});
