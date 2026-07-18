interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-accent)] px-6 py-12 text-center">
      <h3 className="text-base font-medium text-[var(--color-foreground)]">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-[var(--color-muted-foreground)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
