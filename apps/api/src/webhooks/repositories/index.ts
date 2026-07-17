import { prisma } from "@/lib/prisma";

import type { WebhookRepository } from "./webhook.repository";
import { PrismaWebhookRepository } from "./prisma-webhook.repository";

let webhookRepository: WebhookRepository | undefined;

export function getWebhookRepository(): WebhookRepository {
  if (!webhookRepository) {
    webhookRepository = new PrismaWebhookRepository(prisma);
  }

  return webhookRepository;
}

export { MemoryWebhookRepository } from "./memory-webhook.repository";
export type { WebhookRepository } from "./webhook.repository";
export { PrismaWebhookRepository } from "./prisma-webhook.repository";
