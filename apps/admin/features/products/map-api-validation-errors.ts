import { AdminApiError } from "@/types/api";

type FieldErrorMap = Partial<Record<string, string>>;

function isZodFlatten(details: unknown): details is {
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
} {
  return typeof details === "object" && details !== null;
}

/** Map API / Zod flatten details onto react-hook-form field errors. */
export function mapApiValidationErrors(error: unknown): {
  readonly fieldErrors: FieldErrorMap;
  readonly formMessage: string;
} {
  if (!(error instanceof AdminApiError)) {
    return {
      fieldErrors: {},
      formMessage:
        error instanceof Error ? error.message : "Unable to create product.",
    };
  }

  const fieldErrors: FieldErrorMap = {};

  if (isZodFlatten(error.details) && error.details.fieldErrors) {
    for (const [field, messages] of Object.entries(error.details.fieldErrors)) {
      const message = messages?.find((entry) => entry.trim().length > 0);
      if (message) {
        fieldErrors[field] = message;
      }
    }
  }

  return {
    fieldErrors,
    formMessage: error.message || "Unable to create product.",
  };
}
