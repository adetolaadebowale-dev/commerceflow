"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Customer } from "@commerceflow/types";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CUSTOMER_FORM_DEFAULTS,
  customerCreateFormSchema,
  customerEditFormSchema,
  type CustomerFormValues,
} from "@/features/customers/customer-form-schema";
import { mapApiValidationErrors } from "@/features/products/map-api-validation-errors";
import { AdminApiError } from "@/types/api";

export interface CustomerFormProps {
  readonly customer?: Customer | null;
  readonly mode: "create" | "edit";
  readonly isSubmitting?: boolean;
  readonly onSubmit: (values: CustomerFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly submitLabel?: string;
}

function toDefaultValues(customer?: Customer | null): CustomerFormValues {
  if (!customer) {
    return { ...CUSTOMER_FORM_DEFAULTS };
  }
  return {
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone ?? "",
    status: customer.status,
  };
}

export function CustomerForm({
  customer,
  mode,
  isSubmitting = false,
  onSubmit,
  onCancel,
  submitLabel,
}: CustomerFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const schema =
    mode === "create" ? customerCreateFormSchema : customerEditFormSchema;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaultValues(customer),
  });

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    form.reset(toDefaultValues(customer));
    setFormError(null);
  }, [customer, form]);

  async function submit(values: CustomerFormValues) {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      const mapped = mapApiValidationErrors(error);
      for (const [field, message] of Object.entries(mapped.fieldErrors)) {
        if (message) {
          setError(field as keyof CustomerFormValues, { message });
        }
      }
      if (
        error instanceof AdminApiError &&
        error.code === "CUSTOMER_EMAIL_ALREADY_EXISTS"
      ) {
        setError("email", { message: error.message });
      }
      if (error instanceof AdminApiError && error.status === 403) {
        setFormError("You do not have permission to manage customers.");
      } else {
        setFormError(mapped.formMessage);
      }
      throw error;
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        try {
          await submit(values);
        } catch {
          // Mapped onto fields / formError.
        }
      })}
      noValidate
    >
      {formError ? (
        <ErrorState title="Unable to save customer" message={formError} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="customer-first-name" className="text-sm font-medium">
            First name
          </label>
          <Input
            id="customer-first-name"
            autoComplete="given-name"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.firstName)}
            {...register("firstName")}
          />
          {errors.firstName ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.firstName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="customer-last-name" className="text-sm font-medium">
            Last name
          </label>
          <Input
            id="customer-last-name"
            autoComplete="family-name"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.lastName)}
            {...register("lastName")}
          />
          {errors.lastName ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.lastName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="customer-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="customer-email"
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="customer-phone" className="text-sm font-medium">
            Phone <span className="font-normal text-[var(--color-muted-foreground)]">(optional)</span>
          </label>
          <Input
            id="customer-phone"
            type="tel"
            autoComplete="tel"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
          {errors.phone ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.phone.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="customer-status" className="text-sm font-medium">
            Status
          </label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="customer-status"
                  aria-invalid={Boolean(errors.status)}
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.status.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : (submitLabel ??
              (mode === "create" ? "Create customer" : "Save changes"))}
        </Button>
      </div>
    </form>
  );
}
