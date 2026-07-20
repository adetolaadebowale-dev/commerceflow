import { ProductDetail } from "@/features/products/product-detail";

interface ProductDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  return <ProductDetail productId={id} />;
}
