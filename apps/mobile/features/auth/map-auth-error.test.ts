import { ApiClientError } from "@commerceflow/api-client";
import { describe, expect, it, vi } from "vitest";

import { applyAuthFormError } from "./map-auth-error";

describe("applyAuthFormError", () => {
  it("maps fieldErrors from ApiClientError details", () => {
    const setError = vi.fn();

    applyAuthFormError(
      new ApiClientError("VALIDATION_ERROR", "Validation failed", 400, {
        fieldErrors: {
          email: ["Invalid email address"],
        },
        formErrors: [],
      }),
      setError,
      "fallback",
    );

    expect(setError).toHaveBeenCalledWith("email", {
      type: "server",
      message: "Invalid email address",
    });
  });

  it("falls back to root message for generic ApiClientError", () => {
    const setError = vi.fn();

    applyAuthFormError(
      new ApiClientError("UNAUTHORIZED", "Invalid credentials", 401),
      setError,
      "fallback",
    );

    expect(setError).toHaveBeenCalledWith("root", {
      type: "server",
      message: "Invalid credentials",
    });
  });

  it("uses fallback for unknown errors", () => {
    const setError = vi.fn();

    applyAuthFormError(new Error("boom"), setError, "Unable to sign in");

    expect(setError).toHaveBeenCalledWith("root", {
      type: "server",
      message: "Unable to sign in",
    });
  });
});
