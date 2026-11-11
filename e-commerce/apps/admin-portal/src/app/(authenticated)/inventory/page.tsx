"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Search, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import type { Product } from "@/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter tabs: "all" | "low" | "out"
  const [activeTab, setActiveTab] = useState<"all" | "low" | "out">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Map to hold temporary inputs for editing stock counts
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [updateLoading, setUpdateLoading] = useState<Record<string, boolean>>({});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/products?limit=100");
      if (response.data.success) {
        const prodList = response.data.data || [];
        setProducts(prodList);
        // Initialize stockInputs map
        const inputs: Record<string, string> = {};
        prodList.forEach((p: Product) => {
          if (p && p.id) {
            inputs[p.id] = (p.stock ?? 0).toString();
          }
        });
        setStockInputs(inputs);
      }
    } catch (err) {
      setError("Failed to fetch inventory catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockChangeInput = (id: string, value: string) => {
    setStockInputs({ ...stockInputs, [id]: value });
  };

  const handleStockUpdate = async (id: string) => {
    const val = stockInputs[id];
    if (val === "" || isNaN(parseInt(val)) || parseInt(val) < 0) {
      alert("Please enter a valid non-negative integer for stock.");
      return;
    }

    setUpdateLoading({ ...updateLoading, [id]: true });
    try {
      const response = await api.put(`/api/v1/products/${id}`, { stock: parseInt(val) });
      if (response.data.success) {
        // Update local products state
        setProducts(products.map(p => p.id === id ? { ...p, stock: parseInt(val) } : p));
        alert("Stock updated successfully.");
      }
    } catch (err) {
      alert("Failed to update product stock.");
    } finally {
      setUpdateLoading({ ...updateLoading, [id]: false });
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", bg: "#FDF2F2", text: "#C75050" };
    if (stock < 5) return { label: "Low Stock", bg: "#FFF9E6", text: "#E65100" };
    return { label: "In Stock", bg: "#E2F0D9", text: "#385723" };
  };

  // Filtering
   const filteredProducts = (products || []).filter(p => {
    if (!p) return false;
    // Search query match (name or sku)
    const nameMatch = (p.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const skuMatch = (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || skuMatch;
    if (!matchesSearch) return false;

    // Tab match
    const stock = p.stock ?? 0;
    if (activeTab === "low") return stock < 5 && stock > 0;
    if (activeTab === "out") return stock === 0;
    return true;
  });

  if (loading) {
    return (
      <div style={{ fontFamily: "var(--font-heading)", fontSize: "14px", color: "var(--color-text-secondary)" }}>
        LOADING INVENTORY LEDGER...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", margin: 0, fontWeight: 500 }}>Inventory</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>
            Monitor and perform instant adjustments on product stock levels
          </p>
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--color-accent-red)", padding: "20px", backgroundColor: "#FFF5F5", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Control bar */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        {/* Search */}
        <div style={{ position: "relative", minWidth: "280px" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }}>
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by Product Name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-admin"
            style={{ paddingLeft: "42px" }}
          />
        </div>

        {/* Filters Tabs */}
        <div style={{ display: "flex", gap: "8px", border: "1px solid var(--color-border)", padding: "4px", backgroundColor: "white" }}>
          <button
            onClick={() => setActiveTab("all")}
            style={{
              padding: "8px 16px",
              fontFamily: "var(--font-heading)",
              fontSize: "11px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "all" ? "var(--color-bg-dark)" : "transparent",
              color: activeTab === "all" ? "white" : "var(--color-text-primary)"
            }}
          >
            All Items
          </button>
          <button
            onClick={() => setActiveTab("low")}
            style={{
              padding: "8px 16px",
              fontFamily: "var(--font-heading)",
              fontSize: "11px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "low" ? "var(--color-bg-dark)" : "transparent",
              color: activeTab === "low" ? "white" : "var(--color-text-primary)"
            }}
          >
            Low Stock ({(products || []).filter(p => (p.stock ?? 0) < 5 && (p.stock ?? 0) > 0).length})
          </button>
          <button
            onClick={() => setActiveTab("out")}
            style={{
              padding: "8px 16px",
              fontFamily: "var(--font-heading)",
              fontSize: "11px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "out" ? "var(--color-bg-dark)" : "transparent",
              color: activeTab === "out" ? "white" : "var(--color-text-primary)"
            }}
          >
            Out of Stock ({(products || []).filter(p => (p.stock ?? 0) === 0).length})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="admin-card">
        <div style={{ overflowX: "auto" }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Status</th>
                <th style={{ width: "240px" }}>Stock Adjustment</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--color-text-secondary)" }}>
                    No products matching search filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const status = getStockStatus(p.stock);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "36px",
                            height: "45px",
                            backgroundColor: "var(--color-bg-cream)",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            {p.images && p.images[0] ? (
                              <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <AlertCircle size={16} color="var(--color-text-muted)" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{p.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--font-heading)" }}>{p.sku}</td>
                      <td>
                        <span style={{
                          backgroundColor: status.bg,
                          color: status.text,
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: 600,
                          fontFamily: "var(--font-heading)"
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <input
                            type="number"
                            min="0"
                            value={stockInputs[p.id] || ""}
                            onChange={(e) => handleStockChangeInput(p.id, e.target.value)}
                            className="input-admin"
                            style={{ width: "80px", textAlign: "center", padding: "6px" }}
                          />
                          <button
                            onClick={() => handleStockUpdate(p.id)}
                            disabled={updateLoading[p.id]}
                            className="btn-admin-primary"
                            style={{ padding: "8px 12px", fontSize: "10px", display: "flex", gap: "4px" }}
                          >
                            {updateLoading[p.id] ? <RefreshCw size={12} className="animate-spin" /> : "Update"}
                          </button>
                        </div>
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
