import { createHmac, randomBytes } from "node:crypto";

import type { WebhookSignatureHeaders } from "@commerceflow/types";

export function generateWebhookSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function signWebhookPayload(
  secret: string,
  timestamp: string,
  payload: string,
): WebhookSignatureHeaders {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return {
    timestamp,
    signature,
  };
}

export function buildWebhookSignatureHeader(
  headers: WebhookSignatureHeaders,
): string {
  return `t=${headers.timestamp},v1=${headers.signature}`;
}

export function verifyWebhookSignature(
  secret: string,
  timestamp: string,
  payload: string,
  signature: string,
): boolean {
  const expected = signWebhookPayload(secret, timestamp, payload);
  return expected.signature === signature;
}
