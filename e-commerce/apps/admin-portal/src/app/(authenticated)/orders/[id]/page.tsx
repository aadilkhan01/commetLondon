"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageOpen, FileText, CreditCard } from "lucide-react";
import api from "@/lib/api";

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/api/v1/orders/${id}/admin`);
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setError("Failed to fetch order details.");
      }
    } catch (err) {
      setError("Failed to communicate with order service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to transition this order status to ${newStatus}?`)) return;
    setStatusLoading(true);
    try {
      const response = await api.put(`/api/v1/orders/${id}/status`, { status: newStatus });
      if (response.data.success) {
        setOrder({ ...order, status: newStatus });
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to update order status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const getNextStatuses = (currentStatus: string) => {
    switch (currentStatus.toUpperCase()) {
      case "PENDING": return ["CONFIRMED", "CANCELLED"];
      case "CONFIRMED": return ["PACKED", "CANCELLED"];
      case "PACKED": return ["SHIPPED", "CANCELLED"];
      case "SHIPPED": return ["DELIVERED"];
      default: return [];
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val || 0);
  };

  if (loading) return <div style={{ padding: "40px", fontFamily: "var(--font-heading)" }}>LOADING ORDER...</div>;
  if (error || !order) return <div style={{ padding: "40px", color: "red" }}>{error || "Order not found."}</div>;

  const nextStatuses = getNextStatuses(order.status);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/orders" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--color-text-secondary)", marginBottom: "16px", fontSize: "14px", fontFamily: "var(--font-heading)" }}>
          <ArrowLeft size={20} /> Back to Orders
        </Link>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "28px", margin: "0" }}>
          Order {order.orderNumber}
        </h1>
        <div style={{ display: "inline-block", marginTop: "12px", padding: "6px 12px", backgroundColor: "#f0f0f0", fontSize: "12px", fontWeight: "bold", borderRadius: "4px" }}>
          STATUS: {order.status}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Left Column */}
        <div>
          <div className="card" style={{ marginBottom: "24px", padding: "24px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #EAEAEA" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <PackageOpen size={18} /> Items
            </h3>
            {order.items?.map((item: any) => (
              <div key={item.productId} style={{ display: "flex", gap: "16px", padding: "12px 0", borderBottom: "1px solid #EAEAEA" }}>
                <img src={item.image || "/placeholder.png"} alt={item.name} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontFamily: "var(--font-heading)" }}>{item.name}</div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 600, fontFamily: "var(--font-heading)" }}>
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="card" style={{ padding: "24px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #EAEAEA", marginBottom: "24px" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", marginBottom: "16px" }}>Summary</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
              <span>Shipping</span>
              <span>{formatCurrency(order.shippingCost)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "14px" }}>
              <span>Tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", paddingTop: "16px", fontWeight: "bold", fontFamily: "var(--font-heading)" }}>
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="card" style={{ padding: "24px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #EAEAEA", marginBottom: "24px" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", marginBottom: "16px" }}>Customer & Shipping</h3>
            <p style={{ margin: "4px 0", fontSize: "14px", color: "var(--color-text-secondary)" }}>{order.shippingAddress?.fullName}</p>
            <p style={{ margin: "4px 0", fontSize: "14px", color: "var(--color-text-secondary)" }}>{order.shippingAddress?.addressLine1}</p>
            {order.shippingAddress?.addressLine2 && <p style={{ margin: "4px 0", fontSize: "14px", color: "var(--color-text-secondary)" }}>{order.shippingAddress?.addressLine2}</p>}
            <p style={{ margin: "4px 0", fontSize: "14px", color: "var(--color-text-secondary)" }}>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
            <p style={{ margin: "4px 0", fontSize: "14px", color: "var(--color-text-secondary)" }}>{order.shippingAddress?.country}</p>
            <p style={{ margin: "12px 0 4px", fontSize: "14px", color: "var(--color-text-secondary)" }}>Phone: {order.shippingAddress?.phone}</p>
          </div>

          {nextStatuses.length > 0 && (
            <div className="card" style={{ padding: "24px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #EAEAEA" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", marginBottom: "16px" }}>Update Status</h3>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {nextStatuses.map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={statusLoading}
                    className="btn-primary"
                    style={{ flex: 1, padding: "8px 12px", fontSize: "12px" }}
                  >
                    {statusLoading ? "..." : `Mark as ${status}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
