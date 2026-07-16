import { prisma } from "@/lib/prisma";

import { MemoryJobRepository } from "./memory-job.repository";
import { PrismaJobRepository } from "./prisma-job.repository";
import type { JobRepository } from "./job.repository";

let jobRepository: JobRepository | undefined;

export function getJobRepository(): JobRepository {
  if (!jobRepository) {
    jobRepository = new PrismaJobRepository(prisma);
  }

  return jobRepository;
}

export {
  MemoryJobRepository,
  PrismaJobRepository,
  type JobRepository,
};
