/**
 * Capture product media detail screenshots using system Chrome via puppeteer-core.
 *
 *   pnpm add -D puppeteer-core --filter admin
 *   node scripts/capture-product-media-screenshots.mjs
 *   pnpm remove puppeteer-core --filter admin
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "apps/admin/.tmp/screenshots");
fs.mkdirSync(outDir, { recursive: true });

const require = createRequire(path.join(root, "apps/admin/package.json"));
const puppeteer = require("puppeteer-core");

const ADMIN_URL = process.env.ADMIN_URL ?? "http://localhost:3001";
const EMAIL = "admin@commerceflow.local";
const PASSWORD = "Password123!";

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
  "C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
].filter(Boolean);

const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!executablePath) {
  throw new Error("Chrome not found. Set CHROME_PATH.");
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--window-size=1280,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

try {
  await page.goto(`${ADMIN_URL}/login`, { waitUntil: "networkidle2", timeout: 60_000 });
  await page.waitForSelector("#email, input[name='email']", { timeout: 30_000 });
  await page.type("#email", EMAIL, { delay: 10 });
  await page.type("#password", PASSWORD, { delay: 10 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto(`${ADMIN_URL}/dashboard/products`, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });
  await page.screenshot({
    path: path.join(outDir, "13.6-products-list.png"),
    fullPage: true,
  });

  const clicked = await page.evaluate(() => {
    const row = document.querySelector("table tbody tr");
    if (!row) {
      return false;
    }
    row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return true;
  });

  if (clicked) {
    await page.waitForFunction(
      () => /\/dashboard\/products\/[0-9a-f-]+/i.test(location.pathname),
      { timeout: 30_000 },
    );
    await page.waitForSelector("#edit-name, [aria-label='Edit product information']", {
      timeout: 30_000,
    });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await page.screenshot({
      path: path.join(outDir, "13.6-product-edit.png"),
      fullPage: true,
    });
  } else {
    console.warn("No products found to open detail page");
  }

  console.log(`Screenshots written to ${outDir}`);
} finally {
  await browser.close();
}
