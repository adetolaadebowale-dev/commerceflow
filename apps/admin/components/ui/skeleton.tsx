import { cn } from "@/lib/utils";

interface SkeletonProps {
  readonly className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--color-muted)]",
        className,
      )}
      aria-hidden
    />
  );
}
