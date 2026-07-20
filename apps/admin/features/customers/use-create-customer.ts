"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCustomerRequest } from "@commerceflow/api-client";

import {
  customerDetailQueryKey,
  customersListRootKey,
} from "@/features/customers/customer-query-keys";
import { createCustomer } from "@/services/customers.service";

export function useCreateCustomer(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CreateCustomerRequest, "storeId">) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return createCustomer({ ...input, storeId });
    },
    onSuccess: (customer) => {
      if (!storeId) {
        return;
      }
      queryClient.setQueryData(
        customerDetailQueryKey(storeId, customer.id),
        customer,
      );
      void queryClient.invalidateQueries({
        queryKey: customersListRootKey(storeId),
      });
    },
  });
}
