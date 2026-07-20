/**
 * Development-only: seed one demo order for Admin Orders UI verification.
 *
 * Uses live API domain endpoints (no production logic changes).
 * Requires API running and an existing active product variant in the store.
 *
 *   pnpm --filter api seed:demo-order
 *
 * Env overrides:
 *   API_BASE_URL (default http://localhost:3000)
 *   SEED_STORE_ID (default 11111111-1111-1111-1111-111111111111)
 *   SEED_EMAIL / SEED_PASSWORD (default admin@commerceflow.local / Password123!)
 */

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";
const STORE_ID =
  process.env.SEED_STORE_ID ?? "11111111-1111-1111-1111-111111111111";
const EMAIL = process.env.SEED_EMAIL ?? "admin@commerceflow.local";
const PASSWORD = process.env.SEED_PASSWORD ?? "Password123!";
const DEMO_CUSTOMER_EMAIL = "demo-order@commerceflow.local";

async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      payload?.message ??
      `HTTP ${response.status} ${path}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.error?.code;
    error.details = payload?.error?.details ?? payload;
    throw error;
  }

  return payload?.data ?? payload;
}

async function main() {
  console.log("Seed demo order (development only)");
  console.log(`API: ${API_BASE_URL}`);
  console.log(`Store: ${STORE_ID}`);

  const login = await request("/api/auth/login", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD },
  });
  const token = login.tokens?.accessToken;
  if (!token) {
    throw new Error("Login succeeded but no access token was returned");
  }

  // --- Customer profile (store Customer; order.customerId FKs User, so link via profile) ---
  let customer;
  const customers = await request(
    `/api/customers?storeId=${STORE_ID}&page=1&limit=100&search=${encodeURIComponent(DEMO_CUSTOMER_EMAIL)}`,
    { token },
  );
  customer = (customers.items ?? []).find(
    (entry) => entry.email === DEMO_CUSTOMER_EMAIL,
  );

  if (!customer) {
    customer = (
      await request("/api/customers", {
        method: "POST",
        token,
        body: {
          storeId: STORE_ID,
          email: DEMO_CUSTOMER_EMAIL,
          firstName: "Demo",
          lastName: "Buyer",
          status: "active",
        },
      })
    ).customer;
    console.log(`Created customer profile ${customer.id} (${customer.email})`);
  } else {
    console.log(`Reusing customer profile ${customer.id} (${customer.email})`);
  }

  // --- Existing active product variant ---
  const products = await request(
    `/api/products?storeId=${STORE_ID}&page=1&limit=50&status=active`,
    { token },
  );

  let variant = null;
  let productName = null;
  for (const product of products.items ?? []) {
    const variantsPayload = await request(
      `/api/products/${product.id}/variants?storeId=${STORE_ID}`,
      { token },
    );
    const first = (variantsPayload.items ?? [])[0];
    if (first) {
      variant = first;
      productName = product.name;
      break;
    }
  }

  if (!variant) {
    throw new Error(
      "No active product variant found. Create an active product with a variant in Admin, then re-run this seed.",
    );
  }

  console.log(
    `Using variant ${variant.id} (${variant.sku}) from product “${productName}”`,
  );

  // --- Warehouse + inventory (so Confirm → Reserve works later) ---
  const warehouses = await request(
    `/api/warehouses?storeId=${STORE_ID}&page=1&limit=20&status=active`,
    { token },
  );

  let warehouse = (warehouses.items ?? []).find((entry) => entry.isDefault);
  if (!warehouse) {
    warehouse = (warehouses.items ?? [])[0];
  }

  if (!warehouse) {
    warehouse = (
      await request("/api/warehouses", {
        method: "POST",
        token,
        body: {
          storeId: STORE_ID,
          name: "Demo Warehouse",
          code: "DEMO",
          address: "1 Demo Street",
          city: "Austin",
          stateProvince: "TX",
          postalCode: "78701",
          countryCode: "US",
          status: "active",
          isDefault: true,
        },
      })
    ).warehouse;
    console.log(`Created warehouse ${warehouse.id} (${warehouse.code})`);
  } else {
    console.log(`Reusing warehouse ${warehouse.id} (${warehouse.code})`);
  }

  const inventoryList = await request(
    `/api/inventory-items?storeId=${STORE_ID}&productVariantId=${variant.id}&page=1&limit=20`,
    { token },
  );
  const existingInventory = (inventoryList.items ?? []).find(
    (item) => item.warehouseId === warehouse.id,
  );

  if (!existingInventory) {
    const created = await request("/api/inventory-items", {
      method: "POST",
      token,
      body: {
        storeId: STORE_ID,
        warehouseId: warehouse.id,
        productVariantId: variant.id,
        initialQuantity: 10,
      },
    });
    console.log(
      `Created inventory item ${created.inventoryItem.id} (on hand ${created.inventoryItem.quantityOnHand})`,
    );
  } else {
    console.log(
      `Reusing inventory item ${existingInventory.id} (on hand ${existingInventory.quantityOnHand})`,
    );
  }

  // --- Draft order (best for manual Confirm → Reserve → Fulfill) ---
  // Note: createOrder.customerId maps to User FK. Use guest create, then attach
  // the store Customer profile via Prisma (customerProfileId) for Admin display.
  const created = await request("/api/orders", {
    method: "POST",
    token,
    body: {
      storeId: STORE_ID,
      status: "draft",
      items: [{ productVariantId: variant.id, quantity: 1 }],
    },
  });

  let order = created.order;

  // Attach store customer profile (development seed only; not an API feature).
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await prisma.order.update({
      where: { id: order.id },
      data: { customerProfileId: customer.id },
    });
    const refreshed = await request(
      `/api/orders/${order.id}?storeId=${STORE_ID}`,
      { token },
    );
    order = refreshed.order;
  } finally {
    await prisma.$disconnect();
  }
  console.log("");
  console.log("Demo order seeded.");
  console.log(`  Order ID:     ${order.id}`);
  console.log(`  Order number: ${order.orderNumber}`);
  console.log(`  Status:       ${order.status}`);
  console.log(`  Total:        ${order.total} ${order.currency}`);
  console.log(`  Customer:     ${customer.firstName} ${customer.lastName} (${customer.email})`);
  console.log(`  Variant SKU:  ${variant.sku}`);
  console.log(`  Profile ID:   ${order.customerProfileId ?? "—"}`);
  console.log("");
  console.log("Open in Admin:");
  console.log(`  http://localhost:3001/dashboard/orders/${order.id}`);
  console.log("");
  console.log("Validation steps:");
  console.log("  1. Open /dashboard/orders — the new order should appear.");
  console.log("  2. Open the order detail — summary, customer, items, timeline.");
  console.log("  3. Click Confirm Order (draft → confirmed).");
  console.log("  4. Click Reserve Inventory (uses seeded warehouse stock).");
  console.log("  5. Click Fulfill Order.");
}

main().catch((error) => {
  console.error("Seed failed:", error.message);
  if (error.code) {
    console.error(`Code: ${error.code}`);
  }
  if (error.details) {
    console.error(JSON.stringify(error.details, null, 2));
  }
  process.exitCode = 1;
});
