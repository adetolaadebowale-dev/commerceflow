"use client";

import type { Customer } from "@commerceflow/types";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { CustomerStatusBadge } from "@/features/customers/customer-status-badge";
import { formatCustomerFullName } from "@/services/customers.service";
import { formatDateTime } from "@/lib/format";

export interface CustomerRowProps {
  readonly customer: Customer;
  readonly actionsDisabled?: boolean;
  readonly onEdit: () => void;
}

export function CustomerRow({
  customer,
  actionsDisabled = false,
  onEdit,
}: CustomerRowProps) {
  const router = useRouter();
  const href = `/dashboard/customers/${customer.id}`;

  function navigate() {
    router.push(href);
  }

  return (
    <TableRow
      className="cursor-pointer"
      tabIndex={0}
      role="link"
      aria-label={`View customer ${formatCustomerFullName(customer)}`}
      onClick={navigate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate();
        }
      }}
    >
      <TableCell className="font-medium">
        {formatCustomerFullName(customer)}
      </TableCell>
      <TableCell>{customer.email}</TableCell>
      <TableCell>{customer.phone ?? "—"}</TableCell>
      <TableCell>
        <CustomerStatusBadge status={customer.status} />
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {formatDateTime(customer.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={actionsDisabled}
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          Edit
        </Button>
      </TableCell>
    </TableRow>
  );
}
