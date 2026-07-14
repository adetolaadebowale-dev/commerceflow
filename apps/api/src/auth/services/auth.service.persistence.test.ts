import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { AuthService } from "./auth.service";

const databaseUrl = process.env.DATABASE_URL;

function uniqueEmail(): string {
  return `persist-${crypto.randomUUID()}@example.com`;
}

function validRegisterInput(email: string) {
  return {
    email,
    password: "password123",
    firstName: "Persist",
    lastName: "User",
  };
}

describe.skipIf(!databaseUrl)("AuthService persistence", () => {
  const prisma = new PrismaClient();

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: "persist-",
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists registration and login through PostgreSQL", async () => {
    const authService = new AuthService();
    const email = uniqueEmail();
    const input = validRegisterInput(email);

    const registered = await authService.register(input);
    expect(registered.user.email).toBe(email);

    const loggedIn = await authService.login({
      email,
      password: input.password,
    });

    expect(loggedIn.user.id).toBe(registered.user.id);
    expect(loggedIn.tokens.accessToken).toBeTruthy();
  });

  it("persists logout by revoking the session in the database", async () => {
    const authService = new AuthService();
    const email = uniqueEmail();
    const { tokens } = await authService.register(validRegisterInput(email));

    await authService.logout({ refreshToken: tokens.refreshToken });

    const payload = await prisma.session.findFirst({
      where: { user: { email } },
    });

    expect(payload?.status).toBe("revoked");
  });

  it("persists refresh token rotation in the database", async () => {
    const authService = new AuthService();
    const email = uniqueEmail();
    const { tokens } = await authService.register(validRegisterInput(email));

    const refreshed = await authService.refreshToken({
      refreshToken: tokens.refreshToken,
    });

    expect(refreshed.tokens.refreshToken).not.toBe(tokens.refreshToken);

    const currentUser = await authService.getCurrentUser(
      refreshed.tokens.accessToken,
    );

    expect(currentUser.user.email).toBe(email);
  });

  it("survives server restarts by reloading sessions from PostgreSQL", async () => {
    const email = uniqueEmail();
    const input = validRegisterInput(email);

    const firstInstance = new AuthService();
    const { tokens } = await firstInstance.register(input);

    const restartedInstance = new AuthService();
    const currentUser = await restartedInstance.getCurrentUser(
      tokens.accessToken,
    );

    expect(currentUser.user.email).toBe(email);

    const refreshed = await restartedInstance.refreshToken({
      refreshToken: tokens.refreshToken,
    });

    expect(refreshed.tokens.accessToken).toBeTruthy();
  });
});
