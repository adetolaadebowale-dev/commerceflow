/**
 * Browser verification for Sprint 13.1 dashboard using system Chrome.
 * Run from apps/admin after starting:
 *   - node ../../scripts/mock-api-for-dashboard-verify.mjs
 *   - pnpm --filter admin dev
 *
 *   node ../../scripts/verify-dashboard-browser.mjs
 * (requires playwright installed in apps/admin, or copy into apps/admin)
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../apps/admin/package.json"),
);
const { chromium } = require("playwright");

const ADMIN_URL = process.env.ADMIN_URL ?? "http://localhost:3001";
const EMAIL = "admin@commerceflow.local";
const PASSWORD = "Password123!";

const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

function isIgnorableFailedRequest(entry) {
  return (
    entry.includes("favicon") ||
    entry.includes("_rsc=") ||
    entry.includes("net::ERR_ABORTED")
  );
}

function isIgnorableConsoleError(entry) {
  return (
    entry.includes("favicon") ||
    entry.includes("404 (Not Found)") ||
    entry.includes("_rsc=")
  );
}

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});

const context = await browser.newContext();
await context.clearCookies();
const page = await context.newPage();

const consoleErrors = [];
const failedRequests = [];

page.on("console", (msg) => {
  if (msg.type() === "error") {
    consoleErrors.push(msg.text());
  }
});

page.on("requestfailed", (request) => {
  failedRequests.push(
    `${request.failure()?.errorText ?? "failed"} ${request.url()}`,
  );
});

page.on("response", (response) => {
  if (response.status() >= 400) {
    failedRequests.push(`${response.status()} ${response.url()}`);
  }
});

try {
  await page.goto(`${ADMIN_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });

  await page.getByText("CommerceFlow Admin").waitFor({ timeout: 15000 });
  assert(
    await page.getByText("CommerceFlow Admin").isVisible(),
    "Login page renders",
  );

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("**/dashboard", { timeout: 15000 });
  assert(page.url().includes("/dashboard"), "Redirects to dashboard after login");

  await page.waitForSelector("text=Total Products", { timeout: 15000 });
  assert(await page.getByText("Total Products").isVisible(), "KPI: Total Products");
  assert(await page.getByText("Total Orders").isVisible(), "KPI: Total Orders");
  assert(await page.getByText("Total Customers").isVisible(), "KPI: Total Customers");
  assert(await page.getByText("Inventory Value").isVisible(), "KPI: Inventory Value");

  assert(await page.getByText("ORD-1001").isVisible(), "Recent order ORD-1001 visible");
  assert(await page.getByText("Ada Lovelace").isVisible(), "Recent order customer visible");
  assert(await page.getByText("Classic Tee").isVisible(), "Low stock product visible");
  assert(await page.getByText("TEE-001").isVisible(), "Low stock SKU visible");
  assert(await page.getByText("order create").isVisible(), "Recent activity visible");
  assert(
    await page.getByRole("link", { name: /Add Product/i }).isVisible(),
    "Quick action Add Product visible",
  );

  await page.getByRole("link", { name: /Add Product/i }).click();
  await page.waitForURL("**/products", { timeout: 10000 });
  assert(
    await page.getByText("This area will be completed in a later sprint.").isVisible(),
    "Products placeholder route works",
  );

  const meaningfulConsoleErrors = consoleErrors.filter(
    (entry) => !isIgnorableConsoleError(entry),
  );
  const meaningfulFailedRequests = failedRequests.filter(
    (entry) => !isIgnorableFailedRequest(entry),
  );

  assert(
    meaningfulConsoleErrors.length === 0,
    `No browser console errors (${meaningfulConsoleErrors.length})`,
  );
  assert(
    meaningfulFailedRequests.length === 0,
    `No failed network requests (${meaningfulFailedRequests.length})`,
  );
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`\nVerification failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("\nDashboard browser verification passed.");
