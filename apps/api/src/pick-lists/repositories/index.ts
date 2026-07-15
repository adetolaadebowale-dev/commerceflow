import { PrismaPickListRepository } from "./prisma-pick-list.repository";
import type { PickListRepository } from "./pick-list.repository";
import { prisma } from "@/lib/prisma";

const pickListRepository: PickListRepository = new PrismaPickListRepository(
  prisma,
);

export function getPickListRepository(): PickListRepository {
  return pickListRepository;
}

export type { PickListItemContext, PickListRepository } from "./pick-list.repository";
export type {
  CreatePickListRecord,
  CreatePickListItemRecord,
  PickListStatusTransitionInput,
} from "./pick-list-create-record";
