"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import api from "@/lib/api";
import type { Order } from "@/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/orders/admin/all");
      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (err) {
      setError("Failed to fetch order history registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatCurrency = (val: number | undefined | null) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val || 0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "DELIVERED":
        return { bg: "#E2F0D9", text: "#385723" };
      case "SHIPPED":
        return { bg: "#FFF2CC", text: "#7F6000" };
      case "PENDING":
        return { bg: "#FCE4D6", text: "#C65911" };
      case "CANCELLED":
        return { bg: "#F2F2F2", text: "#595959" };
      default:
        return { bg: "#E1F5FE", text: "#0288D1" };
    }
  };
  if (loading) {
    return (
      <div style={{ fontFamily: "var(--font-heading)", fontSize: "14px", color: "var(--color-text-secondary)" }}>
        LOADING ORDERS REGISTRY...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", margin: 0, fontWeight: 500 }}>Orders</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>
          Process transactions, fulfill shipping, and review order logs
        </p>
      </div>

      {error && (
        <div style={{ color: "var(--color-accent-red)", padding: "20px", backgroundColor: "#FFF5F5", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="admin-card">
        <div style={{ overflowX: "auto" }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-secondary)" }}>
                    No orders found in the registry database.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const colors = getStatusColor(order.status);
                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600, fontFamily: "var(--font-heading)" }}>
                        <Link href={`/orders/${order.id}`} style={{ color: "var(--color-text-primary)", textDecoration: "underline" }}>
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td>{order.paymentMethod}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td style={{ fontFamily: "var(--font-heading)", fontWeight: 500 }}>
                        {formatCurrency(order.total)}
                      </td>
                      <td>
                        <span style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: 600,
                          fontFamily: "var(--font-heading)"
                        }}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
