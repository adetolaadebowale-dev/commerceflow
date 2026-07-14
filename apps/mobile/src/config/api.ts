export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

console.log("[startup][api.ts] API_BASE_URL initialized:", API_BASE_URL);
