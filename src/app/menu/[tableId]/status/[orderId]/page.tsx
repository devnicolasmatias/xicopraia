import { notFound } from "next/navigation";
import { getGuestOrderStatus } from "@/app/actions/guestOrders";
import OrderStatusClient from "./_components/OrderStatusClient";

interface Props {
  params: Promise<{ tableId: string; orderId: string }>;
}

export default async function OrderStatusPage({ params }: Props) {
  const { tableId, orderId } = await params;
  const order = await getGuestOrderStatus(orderId);

  if (!order) notFound();

  return <OrderStatusClient tableId={tableId} order={order} />;
}
