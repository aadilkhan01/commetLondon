import OrderConfirmationClient from "@/components/checkout/OrderConfirmationClient";

export default function OrderConfirmationPage({ params }: { params: { id: string } }) {
  return <OrderConfirmationClient orderId={params.id} />;
}
