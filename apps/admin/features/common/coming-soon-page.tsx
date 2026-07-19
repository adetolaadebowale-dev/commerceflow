import { EmptyState } from "@/components/ui/empty-state";

interface ComingSoonPageProps {
  readonly title: string;
  readonly description?: string;
}

export function ComingSoonPage({
  title,
  description = "This area will be completed in a later sprint.",
}: ComingSoonPageProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <EmptyState title={title} description={description} />
    </div>
  );
}
