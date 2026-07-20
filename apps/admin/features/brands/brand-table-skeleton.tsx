import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BrandTableSkeletonProps {
  readonly rows?: number;
}

export function BrandTableSkeleton({ rows = 6 }: BrandTableSkeletonProps) {
  return (
    <Table aria-busy="true" aria-label="Loading brands">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Created Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }, (_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-36" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Skeleton className="h-4 w-48" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-8 w-28" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
