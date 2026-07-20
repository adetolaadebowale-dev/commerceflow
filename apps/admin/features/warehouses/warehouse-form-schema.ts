import { WAREHOUSE_STATUSES } from "@commerceflow/types";
import { createWarehouseSchema } from "@commerceflow/validation";
import { z } from "zod";

/** UI form schema derived from shared createWarehouseSchema (no storeId). */
export const warehouseFormSchema = createWarehouseSchema
  .omit({ storeId: true })
  .extend({
    status: z.enum(WAREHOUSE_STATUSES),
    isDefault: z.boolean(),
  });

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

export const WAREHOUSE_FORM_DEFAULTS: WarehouseFormValues = {
  name: "",
  code: "",
  address: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  countryCode: "US",
  status: "active",
  isDefault: false,
};
