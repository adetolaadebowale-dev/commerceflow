import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardLowStockRow } from "@/types/dashboard";

interface LowStockTableProps {
  readonly items: readonly DashboardLowStockRow[];
  readonly isLoading?: boolean;
  readonly error?: string | null;
}

export function LowStockTable({
  items,
  isLoading = false,
  error = null,
}: LowStockTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Low Stock</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex min-h-[8rem] items-center justify-center">
            <LoadingSpinner label="Loading low stock..." />
          </div>
        ) : error ? (
          <ErrorState title="Unable to load low stock" message={error} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No low stock items"
            description="Inventory levels are healthy relative to configured thresholds."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Remaining Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.remainingQuantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
