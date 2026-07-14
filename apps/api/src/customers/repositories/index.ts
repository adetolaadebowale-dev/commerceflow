import { PrismaCustomerRepository } from "./prisma-customer.repository";
import type { CustomerRepository } from "./customer.repository";
import { prisma } from "@/lib/prisma";

const customerRepository: CustomerRepository = new PrismaCustomerRepository(
  prisma,
);

export function getCustomerRepository(): CustomerRepository {
  return customerRepository;
}

export type { CustomerRepository } from "./customer.repository";
