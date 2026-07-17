import { DEPLOYMENT_TARGETS } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const deploymentReadinessStoreQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const updateDeploymentConfigurationSchema = z.object({
  storeId: storeIdSchema,
  target: z.enum(DEPLOYMENT_TARGETS),
  requireHttps: z.boolean(),
  requireMigrationsApplied: z.boolean(),
  minimumNodeVersion: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?(\.\d+)?$/, "Minimum Node version must be semver-like"),
  releaseChannel: z
    .string()
    .trim()
    .min(1, "Release channel is required")
    .max(50, "Release channel must be at most 50 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Release channel must use lowercase letters, numbers, and hyphens",
    ),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be at most 500 characters")
    .optional(),
});

export type DeploymentReadinessStoreQuery = z.infer<
  typeof deploymentReadinessStoreQuerySchema
>;
export type UpdateDeploymentConfigurationInput = z.infer<
  typeof updateDeploymentConfigurationSchema
>;
