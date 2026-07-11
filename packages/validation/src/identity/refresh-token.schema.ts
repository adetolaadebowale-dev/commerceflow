import { z } from "zod";

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(1, "Refresh token is required")
    .max(2048, "Refresh token is invalid"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
