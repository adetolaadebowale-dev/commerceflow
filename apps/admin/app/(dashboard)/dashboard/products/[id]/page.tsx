import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface ProductDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Product detail</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Product ID: {id}
        </p>
      </div>

      <EmptyState
        title="Product detail coming soon"
        description="This placeholder will be replaced with the full product detail view in a later sprint."
      />

      <div>
        <Button asChild variant="outline">
          <Link href="/dashboard/products">Back to products</Link>
        </Button>
      </div>
    </div>
  );
}
