import { PrismaCustomerRepository } from "./prisma-customer.repository";
import { PrismaCustomerAddressRepository } from "./prisma-customer-address.repository";
import type { CustomerRepository } from "./customer.repository";
import type { CustomerAddressRepository } from "./customer-address.repository";
import { prisma } from "@/lib/prisma";

const customerRepository: CustomerRepository = new PrismaCustomerRepository(
  prisma,
);
const customerAddressRepository: CustomerAddressRepository =
  new PrismaCustomerAddressRepository(prisma);

export function getCustomerRepository(): CustomerRepository {
  return customerRepository;
}

export function getCustomerAddressRepository(): CustomerAddressRepository {
  return customerAddressRepository;
}

export type { CustomerRepository } from "./customer.repository";
export type {
  CustomerAddressRepository,
  CreateCustomerAddressRecordInput,
} from "./customer-address.repository";
