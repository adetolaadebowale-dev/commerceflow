/**
 * Temporary mock API for Sprint 13.1 browser verification.
 * Not part of the product — run with: node scripts/verify-dashboard-mock-api.mjs
 */
import http from "node:http";
import { URL } from "node:url";

const PORT = 3000;
const STORE_ID = "11111111-1111-1111-1111-111111111111";
const USER = {
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  email: "admin@commerceflow.local",
  emailVerified: true,
  firstName: "Alex",
  lastName: "Admin",
  role: "admin",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const tokens = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
  refreshTokenExpiresAt: "2099-01-01T00:00:00.000Z",
  tokenType: "Bearer",
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

function requireAuth(req, res) {
  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) {
    json(res, 401, {
      error: { code: "AUTH_UNAUTHENTICATED", message: "Unauthorized" },
    });
    return false;
  }
  return true;
}

function listResult(items, total = items.length) {
  return { items, total, page: 1, limit: 100, totalPages: 1 };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  await new Promise((resolve) => req.on("end", resolve));

  if (req.method === "POST" && path === "/api/auth/login") {
    const parsed = body ? JSON.parse(body) : {};
    if (parsed.email === USER.email && parsed.password === "Password123!") {
      json(res, 200, { data: { user: USER, tokens } });
      return;
    }
    json(res, 401, {
      error: {
        code: "AUTH_INVALID_CREDENTIALS",
        message: "Invalid email or password",
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

  if (req.method === "GET" && path === "/api/auth/me") {
    if (!requireAuth(req, res)) return;
    json(res, 200, {
      data: {
        user: USER,
        permissions: [],
        session: {
          id: "session-1",
          userId: USER.id,
          expiresAt: "2099-01-01T00:00:00.000Z",
          createdAt: "2026-01-01T00:00:00.000Z",
          lastActiveAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });
    return;
  }

  if (!requireAuth(req, res)) return;

  if (req.method === "GET" && path === "/api/products") {
    json(
      res,
      200,
      {
        data: listResult(
          [
            {
              id: "product-1",
              name: "Classic Tee",
              variants: [
                { id: "variant-1", sku: "TEE-001", name: "Default" },
              ],
            },
          ],
          12,
        ),
      },
    );
    return;
  }

  if (req.method === "GET" && path === "/api/orders") {
    json(res, 200, {
      data: listResult(
        [
          {
            id: "order-1",
            orderNumber: "ORD-1001",
            customerId: "customer-1",
            status: "confirmed",
            total: "42.50",
            currency: "USD",
            createdAt: "2026-07-18T10:00:00.000Z",
          },
        ],
        34,
      ),
    });
    return;
  }

  if (req.method === "GET" && path === "/api/customers") {
    json(res, 200, {
      data: listResult(
        [
          {
            id: "customer-1",
            email: "ada@example.com",
            firstName: "Ada",
            lastName: "Lovelace",
          },
        ],
        56,
      ),
    });
    return;
  }

  if (req.method === "GET" && path === "/api/reports/inventory/summary") {
    json(res, 200, {
      data: {
        storeId: STORE_ID,
        metrics: { inventoryValue: "1250.00", currency: "USD" },
      },
    });
    return;
  }

  if (req.method === "GET" && path === "/api/reports/inventory/low-stock") {
    json(res, 200, {
      data: {
        storeId: STORE_ID,
        lowStockItems: [
          {
            inventoryItemId: "inv-1",
            productVariantId: "variant-1",
            quantityAvailable: 2,
            quantityOnHand: 2,
          },
        ],
        outOfStockItems: [],
      },
    });
    return;
  }

  if (req.method === "GET" && path === "/api/audit-logs") {
    json(res, 200, {
      data: listResult([
        {
          id: "audit-1",
          userId: USER.id,
          action: "order_create",
          createdAt: "2026-07-18T11:00:00.000Z",
        },
      ]),
    });
    return;
  }

  json(res, 404, {
    error: { code: "NOT_FOUND", message: `No mock for ${path}` },
  });
});

server.listen(PORT, () => {
  console.log(`Mock API listening on http://localhost:${PORT}`);
  console.log(`Login: ${USER.email} / Password123!`);
  console.log(`Store ID: ${STORE_ID}`);
});
