import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardKpi } from "@/types/dashboard";

interface KpiCardsProps {
  readonly kpis: readonly DashboardKpi[];
}

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              {kpi.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">{kpi.value}</p>
            {kpi.error ? (
              <p className="mt-2 text-xs text-red-600" role="alert">
                {kpi.error}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
