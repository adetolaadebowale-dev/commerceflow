import { OrderDetail } from "@/features/orders/order-detail";

export default async function DashboardOrderDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetail orderId={id} />;
}
