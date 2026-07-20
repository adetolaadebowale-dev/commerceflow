"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateCustomerRequest } from "@commerceflow/api-client";

import {
  customerDetailQueryKey,
  customersListRootKey,
} from "@/features/customers/customer-query-keys";
import { updateCustomer } from "@/services/customers.service";

export function useUpdateCustomer(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      readonly id: string;
      readonly input: UpdateCustomerRequest;
    }) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return updateCustomer(id, input, { storeId });
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
