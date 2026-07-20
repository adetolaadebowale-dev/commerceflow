import { ReportCard, type ReportCardProps } from "@/features/reports/report-card";

export interface MetricGridProps {
  readonly metrics: readonly ReportCardProps[];
}

export function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <ReportCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}
