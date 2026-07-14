import { describe, expect, it } from "vitest";

import { CATALOGUE_ERROR_CODES } from "../errors";
import {
  createMemoryCatalogueServices,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validBrandInput,
  validCategoryInput,
  validProductInput,
} from "../testing/catalogue-test-utils";

describe("CategoryService", () => {
  it("creates, lists, gets, and updates a category", async () => {
    const { categoryService } = createMemoryCatalogueServices();
    const input = validCategoryInput();

    const created = await categoryService.createCategory(input);
    expect(created.slug).toBe(input.slug);
    expect(created.storeId).toBe(TEST_STORE_A_ID);

    const listed = await categoryService.listCategories({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(1);
    expect(listed.totalPages).toBe(1);

    const fetched = await categoryService.getCategory(
      TEST_STORE_A_ID,
      created.id,
    );
    expect(fetched.name).toBe(input.name);

    const updated = await categoryService.updateCategory(
      TEST_STORE_A_ID,
      created.id,
      { name: "Updated Accessories" },
    );
    expect(updated.name).toBe("Updated Accessories");
  });

  it("rejects duplicate category slugs within the same store", async () => {
    const { categoryService } = createMemoryCatalogueServices();
    const input = validCategoryInput();

    await categoryService.createCategory(input);

    await expect(categoryService.createCategory(input)).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.SLUG_ALREADY_EXISTS,
      status: 409,
    });
  });

  it("allows duplicate category slugs across different stores", async () => {
    const { categoryService } = createMemoryCatalogueServices();
    const slug = `shared-slug-${crypto.randomUUID().slice(0, 8)}`;

    await categoryService.createCategory(
      validCategoryInput({ storeId: TEST_STORE_A_ID, slug }),
    );

    const created = await categoryService.createCategory(
      validCategoryInput({ storeId: TEST_STORE_B_ID, slug }),
    );

    expect(created.slug).toBe(slug);
  });

  it("rejects parent categories from another store", async () => {
    const { categoryService } = createMemoryCatalogueServices();
    const parent = await categoryService.createCategory(
      validCategoryInput({ storeId: TEST_STORE_A_ID }),
    );

    await expect(
      categoryService.createCategory(
        validCategoryInput({
          storeId: TEST_STORE_B_ID,
          parentId: parent.id,
        }),
      ),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.CATEGORY_NOT_FOUND,
      status: 404,
    });
  });

  it("rejects cyclic parent relationships", async () => {
    const { categoryService } = createMemoryCatalogueServices();
    const categoryA = await categoryService.createCategory(validCategoryInput());
    const categoryB = await categoryService.createCategory(
      validCategoryInput({ parentId: categoryA.id }),
    );
    const categoryC = await categoryService.createCategory(
      validCategoryInput({ parentId: categoryB.id }),
    );

    await expect(
      categoryService.updateCategory(TEST_STORE_A_ID, categoryA.id, {
        parentId: categoryC.id,
      }),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.PARENT_CYCLE,
      status: 400,
    });
  });

  it("hides soft-deleted categories from get, list, and update", async () => {
    const { categoryService, categoryRepository } =
      createMemoryCatalogueServices();
    const created = await categoryService.createCategory(validCategoryInput());

    categoryRepository.softDelete(created.id);

    await expect(
      categoryService.getCategory(TEST_STORE_A_ID, created.id),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });

    const listed = await categoryService.listCategories({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(0);

    await expect(
      categoryService.updateCategory(TEST_STORE_A_ID, created.id, {
        name: "Should fail",
      }),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("paginates category lists", async () => {
    const { categoryService } = createMemoryCatalogueServices();

    for (let index = 0; index < 5; index += 1) {
      await categoryService.createCategory(
        validCategoryInput({ slug: `category-${index}` }),
      );
    }

    const pageOne = await categoryService.listCategories({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 2,
    });
    expect(pageOne.items).toHaveLength(2);
    expect(pageOne.total).toBe(5);
    expect(pageOne.totalPages).toBe(3);

    const pageThree = await categoryService.listCategories({
      storeId: TEST_STORE_A_ID,
      page: 3,
      limit: 2,
    });
    expect(pageThree.items).toHaveLength(1);
  });

  it("isolates categories by store", async () => {
    const { categoryService } = createMemoryCatalogueServices();
    const category = await categoryService.createCategory(validCategoryInput());

    await expect(
      categoryService.getCategory(TEST_STORE_B_ID, category.id),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });
});

describe("ProductService", () => {
  it("creates, lists, gets, and updates a product", async () => {
    const { categoryService, productService } = createMemoryCatalogueServices();
    const category = await categoryService.createCategory(validCategoryInput());
    const input = validProductInput(category.id);

    const created = await productService.createProduct(input);
    expect(created.variants).toHaveLength(1);
    expect(created.storeId).toBe(TEST_STORE_A_ID);

    const listed = await productService.listProducts({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(1);

    const fetched = await productService.getProduct(
      TEST_STORE_A_ID,
      created.id,
    );
    expect(fetched.slug).toBe(input.slug);

    const updated = await productService.updateProduct(
      TEST_STORE_A_ID,
      created.id,
      { status: "active" },
    );
    expect(updated.status).toBe("active");
  });

  it("rejects products with unknown categories", async () => {
    const { productService } = createMemoryCatalogueServices();

    await expect(
      productService.createProduct(
        validProductInput("00000000-0000-0000-0000-000000000099"),
      ),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.CATEGORY_NOT_FOUND,
      status: 404,
    });
  });

  it("rejects products with unknown brands", async () => {
    const { categoryService, productService } = createMemoryCatalogueServices();
    const category = await categoryService.createCategory(validCategoryInput());

    await expect(
      productService.createProduct(
        validProductInput(category.id, {
          brandId: "00000000-0000-0000-0000-000000000099",
        }),
      ),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.BRAND_NOT_FOUND,
      status: 404,
    });
  });

  it("creates products linked to an existing brand", async () => {
    const { brandService, categoryService, productService } =
      createMemoryCatalogueServices();
    const category = await categoryService.createCategory(validCategoryInput());
    const brand = await brandService.createBrand(validBrandInput());

    const product = await productService.createProduct(
      validProductInput(category.id, { brandId: brand.id }),
    );

    expect(product.brandId).toBe(brand.id);
  });

  it("rejects duplicate product slugs within the same store", async () => {
    const { categoryService, productService } = createMemoryCatalogueServices();
    const category = await categoryService.createCategory(validCategoryInput());
    const input = validProductInput(category.id);

    await productService.createProduct(input);

    await expect(productService.createProduct(input)).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.SLUG_ALREADY_EXISTS,
      status: 409,
    });
  });

  it("rejects duplicate variant skus within the same store", async () => {
    const { categoryService, productService } = createMemoryCatalogueServices();
    const category = await categoryService.createCategory(validCategoryInput());
    const input = validProductInput(category.id);

    await productService.createProduct(input);

    await expect(
      productService.createProduct(
        validProductInput(category.id, {
          slug: "another-product",
          variants: input.variants,
        }),
      ),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.SKU_ALREADY_EXISTS,
      status: 409,
    });
  });

  it("allows duplicate variant skus across different stores", async () => {
    const { categoryService, productService } = createMemoryCatalogueServices();
    const categoryA = await categoryService.createCategory(
      validCategoryInput({ storeId: TEST_STORE_A_ID }),
    );
    const categoryB = await categoryService.createCategory(
      validCategoryInput({ storeId: TEST_STORE_B_ID }),
    );
    const sku = `SKU-${crypto.randomUUID().slice(0, 8)}`;
    const variant = {
      sku,
      name: "Default",
      price: "19.99",
      currency: "USD" as const,
    };

    await productService.createProduct(
      validProductInput(categoryA.id, { variants: [variant] }),
    );

    const created = await productService.createProduct(
      validProductInput(categoryB.id, {
        storeId: TEST_STORE_B_ID,
        slug: "other-store-product",
        variants: [variant],
      }),
    );

    expect(created.variants[0]?.sku).toBe(sku);
  });

  it("hides soft-deleted products from get, list, and update", async () => {
    const { categoryService, productService, productRepository } =
      createMemoryCatalogueServices();
    const category = await categoryService.createCategory(validCategoryInput());
    const created = await productService.createProduct(
      validProductInput(category.id),
    );

    productRepository.softDelete(created.id);

    await expect(
      productService.getProduct(TEST_STORE_A_ID, created.id),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });

    const listed = await productService.listProducts({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(0);

    await expect(
      productService.updateProduct(TEST_STORE_A_ID, created.id, {
        status: "active",
      }),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("paginates product lists", async () => {
    const { categoryService, productService } = createMemoryCatalogueServices();
    const category = await categoryService.createCategory(validCategoryInput());

    for (let index = 0; index < 4; index += 1) {
      await productService.createProduct(
        validProductInput(category.id, { slug: `product-${index}` }),
      );
    }

    const result = await productService.listProducts({
      storeId: TEST_STORE_A_ID,
      page: 2,
      limit: 2,
    });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.totalPages).toBe(2);
  });

  it("isolates products by store", async () => {
    const { categoryService, productService } = createMemoryCatalogueServices();
    const category = await categoryService.createCategory(validCategoryInput());
    const product = await productService.createProduct(
      validProductInput(category.id),
    );

    await expect(
      productService.getProduct(TEST_STORE_B_ID, product.id),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("does not persist products when creation fails", async () => {
    const { categoryService, productService, productRepository } =
      createMemoryCatalogueServices();
    const category = await categoryService.createCategory(validCategoryInput());

    productRepository.setCreateFailure(new Error("simulated create failure"));

    await expect(
      productService.createProduct(validProductInput(category.id)),
    ).rejects.toThrow("simulated create failure");

    expect(productRepository.getProductCount()).toBe(0);
  });
});
