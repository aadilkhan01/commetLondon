"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  PackageOpen, 
  ArrowRight 
} from "lucide-react";
import api from "@/lib/api";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/admin/dashboard/stats");
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError("Failed to load dashboard metrics.");
      }
    } catch (err) {
      setError("Failed to connect to administration service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
        FETCHING DASHBOARD ANALYTICS...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "var(--color-accent-red)", padding: "20px", backgroundColor: "#FFF5F5" }}>
        {error}
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Revenue",
      value: stats ? formatCurrency(stats.totalSales) : "$0.00",
      icon: <DollarSign size={20} />,
      color: "var(--color-text-primary)",
      desc: "Sum of non-cancelled orders"
    },
    {
      title: "Orders Received",
      value: stats ? stats.totalOrders.toString() : "0",
      icon: <ShoppingBag size={20} />,
      color: "var(--color-text-primary)",
      desc: "Lifetime order volume"
    },
    {
      title: "Registered Customers",
      value: stats ? stats.totalUsers.toString() : "0",
      icon: <Users size={20} />,
      color: "var(--color-text-primary)",
      desc: "Users with customer role"
    },
    {
      title: "Low Stock Items",
      value: stats ? stats.lowStockCount.toString() : "0",
      icon: <AlertTriangle size={20} />,
      color: stats && stats.lowStockCount > 0 ? "var(--color-accent-red)" : "var(--color-text-primary)",
      desc: "Products with stock < 5",
      link: "/inventory"
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", margin: 0, fontWeight: 500 }}>Dashboard</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>
            Overview of store performance and active catalog inventory
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "24px",
        marginBottom: "40px"
      }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} className="admin-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "140px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-heading)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {kpi.title}
              </span>
              <div style={{ color: "var(--color-text-secondary)" }}>
                {kpi.icon}
              </div>
            </div>
            <div style={{ margin: "16px 0" }}>
              <span style={{ fontSize: "28px", fontWeight: 600, color: kpi.color, fontFamily: kpi.title === "Total Revenue" ? "var(--font-heading)" : "inherit" }}>
                {kpi.value}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{kpi.desc}</span>
              {kpi.link && (
                <Link href={kpi.link} style={{ fontSize: "11px", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none", fontFamily: "var(--font-heading)", textTransform: "uppercase" }}>
                  Manage <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <PackageOpen size={18} /> Recent Orders
          </h2>
          <Link href="/orders" style={{
            fontSize: "12px",
            fontFamily: "var(--font-heading)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--color-text-primary)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            All Orders <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-secondary)" }}>
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.slice(0,10).map((order) => {
                  const colors = getStatusColor(order.status || "");
                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600, fontFamily: "var(--font-heading)" }}>
                        <Link href={`/orders/${order.id}`} style={{ color: "var(--color-text-primary)", textDecoration: "underline" }}>
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td>{order.email}</td>
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
