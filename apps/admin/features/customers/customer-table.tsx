"use client";

import type { Customer } from "@commerceflow/types";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerRow } from "@/features/customers/customer-row";

export interface CustomerTableProps {
  readonly items: readonly Customer[];
  readonly actionsDisabled?: boolean;
  readonly onEdit: (customer: Customer) => void;
}

export function CustomerTable({
  items,
  actionsDisabled = false,
  onEdit,
}: CustomerTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Full Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Created Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((customer) => (
          <CustomerRow
            key={customer.id}
            customer={customer}
            actionsDisabled={actionsDisabled}
            onEdit={() => onEdit(customer)}
          />
        ))}
      </TableBody>
    </Table>
  );
}
