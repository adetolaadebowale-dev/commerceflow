import { createProductVariantSchema } from "@commerceflow/validation";
import { z } from "zod";

/** Form values for create/edit variant dialogs. */
export const variantFormSchema = createProductVariantSchema;

export type VariantFormValues = z.infer<typeof variantFormSchema>;

export const VARIANT_CURRENCY_OPTIONS = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "NGN",
] as const;

export function formatAttributeSummary(
  attributes: Readonly<Record<string, string>> | undefined,
): string {
  if (!attributes) {
    return "—";
  }
  const entries = Object.entries(attributes).filter(
    ([key, value]) => key.trim().length > 0 && value.trim().length > 0,
  );
  if (entries.length === 0) {
    return "—";
  }
  return entries.map(([key, value]) => `${key}: ${value}`).join(" · ");
}

export function generateVariantName(
  attributes: Readonly<Record<string, string>>,
): string {
  const summary = formatAttributeSummary(attributes);
  if (summary === "—") {
    return "Variant";
  }
  return summary.slice(0, 200);
}

export function getVariantDisplayName(variant: {
  readonly name: string;
  readonly attributes?: Readonly<Record<string, string>>;
}): string {
  const trimmed = variant.name.trim();
  if (trimmed.length > 0 && trimmed.toLowerCase() !== "default") {
    return trimmed;
  }
  const fromAttributes = formatAttributeSummary(variant.attributes);
  return fromAttributes === "—" ? trimmed || "Untitled variant" : fromAttributes;
}
