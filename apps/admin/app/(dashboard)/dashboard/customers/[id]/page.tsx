import { CustomerDetail } from "@/features/customers/customer-detail";

export default async function DashboardCustomerDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetail customerId={id} />;
}
