import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReportCardProps {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly isLoading?: boolean;
}

export function ReportCard({
  label,
  value,
  hint,
  isLoading = false,
}: ReportCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        )}
        {hint ? (
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
