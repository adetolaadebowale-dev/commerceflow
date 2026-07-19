/**
 * Temporary local mock API for Sprint 13.1 browser verification.
 * Serves auth + dashboard endpoints consumed by the admin app.
 */
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_API_PORT ?? 3000);
const STORE_ID =
  process.env.NEXT_PUBLIC_DEFAULT_STORE_ID ??
  "11111111-1111-1111-1111-111111111111";

const tokens = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
  refreshTokenExpiresAt: new Date(Date.now() + 86400_000).toISOString(),
  tokenType: "Bearer",
};

const user = {
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  email: "admin@commerceflow.local",
  emailVerified: true,
  firstName: "Alex",
  lastName: "Admin",
  role: "admin",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  });
  res.end(payload);
}

function list(items, total = items.length) {
  return {
    items,
    total,
    page: 1,
    limit: items.length || 20,
    totalPages: 1,
  };
}

function parseBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        resolve(undefined);
      }
    });
  });
}

const products = [
  {
    id: randomUUID(),
    storeId: STORE_ID,
    name: "Classic Tee",
    slug: "classic-tee",
    status: "active",
    categoryId: randomUUID(),
    variants: [
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        productId: "ignored",
        sku: "TEE-001",
        name: "Default",
        price: "25.00",
        currency: "USD",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const customers = [
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    storeId: STORE_ID,
    email: "ada@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const orders = [
  {
    id: randomUUID(),
    storeId: STORE_ID,
    customerId: customers[0].id,
    orderNumber: "ORD-1001",
    status: "confirmed",
    subtotal: "25.00",
    total: "25.00",
    currency: "USD",
    items: [],
    createdAt: "2026-07-18T10:00:00.000Z",
    updatedAt: "2026-07-18T10:00:00.000Z",
  },
];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  if (req.method === "POST" && path === "/api/auth/login") {
    const body = await parseBody(req);
    if (body?.email === "admin@commerceflow.local" && body?.password === "Password123!") {
      json(res, 200, { data: { user, tokens } });
      return;
    }
    json(res, 401, {
      error: { code: "AUTH_INVALID_CREDENTIALS", message: "Invalid email or password" },
    });
    return;
  }

  if (req.method === "GET" && path === "/api/auth/me") {
    json(res, 200, {
      data: {
        user,
        permissions: [],
        session: {
          id: randomUUID(),
          userId: user.id,
          expiresAt: tokens.accessTokenExpiresAt,
          createdAt: "2026-07-18T09:00:00.000Z",
          lastActiveAt: "2026-07-18T10:00:00.000Z",
        },
      },
    });
    return;
  }

  if (req.method === "POST" && path === "/api/auth/logout") {
    json(res, 200, { data: { success: true } });
    return;
  }

  if (req.method === "POST" && path === "/api/auth/refresh") {
    json(res, 200, { data: { tokens } });
    return;
  }

  if (req.method === "GET" && path === "/api/products") {
    json(res, 200, { data: list(products, 12) });
    return;
  }

  if (req.method === "GET" && path === "/api/orders") {
    json(res, 200, { data: list(orders, 34) });
    return;
  }

  if (req.method === "GET" && path === "/api/customers") {
    json(res, 200, { data: list(customers, 56) });
    return;
  }

  if (req.method === "GET" && path === "/api/reports/inventory/summary") {
    json(res, 200, {
      data: {
        storeId: STORE_ID,
        generatedAt: new Date().toISOString(),
        timezone: "UTC",
        filter: { storeId: STORE_ID },
        metrics: {
          quantityOnHand: 10,
          quantityReserved: 0,
          quantityAllocated: 0,
          quantityAvailable: 10,
          quantityIncoming: 0,
          quantityOutgoing: 0,
          inventoryValue: "1000.00",
          stockMovementTotal: 0,
          adjustmentTotal: 0,
          currency: "USD",
        },
        byWarehouse: [],
        byProductVariant: [],
        lowStockItems: [],
        outOfStockItems: [],
        adjustmentReport: {
          adjustmentCount: 0,
          netAdjustmentQuantity: 0,
          positiveAdjustmentQuantity: 0,
          negativeAdjustmentQuantity: 0,
        },
      },
    });
    return;
  }

  if (req.method === "GET" && path === "/api/reports/inventory/low-stock") {
    json(res, 200, {
      data: {
        storeId: STORE_ID,
        generatedAt: new Date().toISOString(),
        timezone: "UTC",
        filter: { storeId: STORE_ID },
        lowStockItems: [
          {
            inventoryItemId: randomUUID(),
            warehouseId: randomUUID(),
            productVariantId: products[0].variants[0].id,
            quantityOnHand: 2,
            quantityAvailable: 2,
            reorderPoint: 5,
            reorderQuantity: 10,
          },
        ],
        outOfStockItems: [],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });
    return;
  }

  if (req.method === "GET" && path === "/api/audit-logs") {
    json(res, 200, {
      data: list([
        {
          id: randomUUID(),
          storeId: STORE_ID,
          userId: user.id,
          sessionId: randomUUID(),
          entityType: "order",
          entityId: orders[0].id,
          action: "order_create",
          metadata: null,
          createdAt: "2026-07-18T10:05:00.000Z",
        },
      ]),
    });
    return;
  }

  json(res, 404, {
    error: { code: "NOT_FOUND", message: `No mock for ${req.method} ${path}` },
  });
});

server.listen(PORT, () => {
  console.log(`Mock API listening on http://localhost:${PORT}`);
});
