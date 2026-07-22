import { ApiClientError } from "@commerceflow/api-client";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

function isFieldErrorsRecord(
  value: unknown,
): value is Record<string, string[] | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Maps ApiClientError / unknown errors onto RHF field or root errors.
 * Backend Zod flatten shape: `{ fieldErrors, formErrors }`.
 */
export function applyAuthFormError<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  fallbackMessage: string,
): void {
  if (!(error instanceof ApiClientError)) {
    setError("root", {
      type: "server",
      message: fallbackMessage,
    });
    return;
  }

  const details = error.details;
  if (
    typeof details === "object" &&
    details !== null &&
    "fieldErrors" in details &&
    isFieldErrorsRecord((details as { fieldErrors: unknown }).fieldErrors)
  ) {
    const fieldErrors = (details as { fieldErrors: Record<string, string[]> })
      .fieldErrors;
    let appliedField = false;

    for (const [field, messages] of Object.entries(fieldErrors)) {
      const message = messages?.[0];
      if (!message) {
        continue;
      }
      setError(field as Path<TFieldValues>, {
        type: "server",
        message,
      });
      appliedField = true;
    }

    if (appliedField) {
      return;
    }
  }

  setError("root", {
    type: "server",
    message: error.message || fallbackMessage,
  });
}
