import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be at most 255 characters"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
