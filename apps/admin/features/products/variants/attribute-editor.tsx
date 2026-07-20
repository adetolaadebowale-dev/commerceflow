"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AttributePair {
  readonly id: string;
  readonly key: string;
  readonly value: string;
}

export interface AttributeEditorProps {
  readonly pairs: readonly AttributePair[];
  readonly onChange: (pairs: AttributePair[]) => void;
  readonly disabled?: boolean;
  readonly error?: string;
}

export function createEmptyAttributePair(): AttributePair {
  return {
    id: crypto.randomUUID(),
    key: "",
    value: "",
  };
}

export function pairsToAttributes(
  pairs: readonly AttributePair[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of pairs) {
    const key = pair.key.trim();
    const value = pair.value.trim();
    if (key.length > 0 && value.length > 0) {
      result[key] = value;
    }
  }
  return result;
}

export function attributesToPairs(
  attributes: Readonly<Record<string, string>> | undefined,
): AttributePair[] {
  const entries = Object.entries(attributes ?? {});
  if (entries.length === 0) {
    return [createEmptyAttributePair()];
  }
  return entries.map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value,
  }));
}

export function AttributeEditor({
  pairs,
  onChange,
  disabled = false,
  error,
}: AttributeEditorProps) {
  function updatePair(id: string, patch: Partial<AttributePair>) {
    onChange(
      pairs.map((pair) => (pair.id === id ? { ...pair, ...patch } : pair)),
    );
  }

  function removePair(id: string) {
    if (pairs.length <= 1) {
      onChange([{ ...pairs[0]!, key: "", value: "" }]);
      return;
    }
    onChange(pairs.filter((pair) => pair.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Attributes</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...pairs, createEmptyAttributePair()])}
        >
          Add attribute
        </Button>
      </div>
      <ul className="space-y-2" aria-label="Variant attributes">
        {pairs.map((pair, index) => (
          <li
            key={pair.id}
            className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div>
              <label className="sr-only" htmlFor={`attr-key-${pair.id}`}>
                Attribute key {index + 1}
              </label>
              <Input
                id={`attr-key-${pair.id}`}
                value={pair.key}
                disabled={disabled}
                placeholder="Size"
                onChange={(event) =>
                  updatePair(pair.id, { key: event.target.value })
                }
              />
            </div>
            <div>
              <label className="sr-only" htmlFor={`attr-value-${pair.id}`}>
                Attribute value {index + 1}
              </label>
              <Input
                id={`attr-value-${pair.id}`}
                value={pair.value}
                disabled={disabled}
                placeholder="XL"
                onChange={(event) =>
                  updatePair(pair.id, { value: event.target.value })
                }
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              aria-label={`Remove attribute ${index + 1}`}
              onClick={() => removePair(pair.id)}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      {error ? (
        <p className="text-sm text-[var(--color-destructive)]" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Example: Size → XL, Color → Black
        </p>
      )}
    </div>
  );
}
