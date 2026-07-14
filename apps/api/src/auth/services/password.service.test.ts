import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password.service";

describe("password.service", () => {
  it("hashes a password", async () => {
    const hash = await hashPassword("password123");

    expect(hash).toContain(":");
    expect(hash).not.toBe("password123");
  });

  it("verifies a correct password", async () => {
    const password = "password123";
    const hash = await hashPassword(password);

    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("rejects an invalid password", async () => {
    const hash = await hashPassword("password123");

    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
