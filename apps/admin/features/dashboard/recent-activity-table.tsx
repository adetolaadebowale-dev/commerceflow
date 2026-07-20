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
import { unableToLoadTitle } from "@/lib/ui-messages";
import type { DashboardActivityRow } from "@/types/dashboard";

interface RecentActivityTableProps {
  readonly activity: readonly DashboardActivityRow[];
  readonly isLoading?: boolean;
  readonly error?: string | null;
}

export function RecentActivityTable({
  activity,
  isLoading = false,
  error = null,
}: RecentActivityTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex min-h-[8rem] items-center justify-center">
            <LoadingSpinner label="Loading activity..." />
          </div>
        ) : error ? (
          <ErrorState title={unableToLoadTitle("recent activity")} message={error} />
        ) : activity.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="Administrative actions will show up here as your team works."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activity.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="capitalize">{row.action}</TableCell>
                  <TableCell>{row.user}</TableCell>
                  <TableCell>{row.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
