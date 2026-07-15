import { PrismaShippingZoneRepository } from "./prisma-shipping-zone.repository";
import { PrismaShippingMethodRepository } from "./prisma-shipping-method.repository";
import type { ShippingZoneRepository } from "./shipping-zone.repository";
import type { ShippingMethodRepository } from "./shipping-method.repository";
import { prisma } from "@/lib/prisma";

const shippingZoneRepository: ShippingZoneRepository =
  new PrismaShippingZoneRepository(prisma);

const shippingMethodRepository: ShippingMethodRepository =
  new PrismaShippingMethodRepository(prisma);

export function getShippingZoneRepository(): ShippingZoneRepository {
  return shippingZoneRepository;
}

export function getShippingMethodRepository(): ShippingMethodRepository {
  return shippingMethodRepository;
}

export type { ShippingZoneRepository } from "./shipping-zone.repository";
export type { ShippingMethodRepository } from "./shipping-method.repository";
