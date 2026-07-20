"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReportDatePreset } from "@/features/reports/report-query-keys";

const PRESETS: readonly { value: ReportDatePreset; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export interface ReportFiltersProps {
  readonly preset: ReportDatePreset;
  readonly customFrom: string;
  readonly customTo: string;
  readonly hasCustomRange: boolean;
  readonly onPresetChange: (preset: ReportDatePreset) => void;
  readonly onCustomRangeChange: (from: string, to: string) => void;
  readonly onClearCustomRange: () => void;
}

export function ReportFilters({
  preset,
  customFrom,
  customTo,
  hasCustomRange,
  onPresetChange,
  onCustomRangeChange,
  onClearCustomRange,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Date range presets"
      >
        {PRESETS.map((option) => {
          const isActive = !hasCustomRange && preset === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={isActive ? "default" : "outline"}
              aria-pressed={isActive}
              onClick={() => onPresetChange(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label htmlFor="report-from-date" className="text-xs font-medium">
            From
          </label>
          <Input
            id="report-from-date"
            type="date"
            value={customFrom}
            onChange={(event) =>
              onCustomRangeChange(event.target.value, customTo)
            }
            aria-label="Report from date"
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="report-to-date" className="text-xs font-medium">
            To
          </label>
          <Input
            id="report-to-date"
            type="date"
            value={customTo}
            onChange={(event) =>
              onCustomRangeChange(customFrom, event.target.value)
            }
            aria-label="Report to date"
            className="w-40"
          />
        </div>
        {hasCustomRange ? (
          <Button type="button" size="sm" variant="ghost" onClick={onClearCustomRange}>
            Clear dates
          </Button>
        ) : null}
      </div>
    </div>
  );
}
