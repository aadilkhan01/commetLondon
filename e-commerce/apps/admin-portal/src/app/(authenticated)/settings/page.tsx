"use client";

import { useEffect, useState } from "react";
import { Settings as SettingsIcon, ShieldAlert } from "lucide-react";
import api from "@/lib/api";
import type { AdminSettings, AuditLog } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Form State
  const [taxRate, setTaxRate] = useState("");
  const [shippingFee, setShippingFee] = useState("");
  const [freeShippingMin, setFreeShippingMin] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [setRes, logRes] = await Promise.all([
        api.get("/api/v1/admin/settings"),
        api.get("/api/v1/admin/audit-logs")
      ]);

      if (setRes.data.success) {
        const s = setRes.data.data || { taxRate: 8.0, shippingFee: 9.99, freeShippingMin: 100.0 };
        setSettings(s);
        setTaxRate((s.taxRate ?? 0).toString());
        setShippingFee((s.shippingFee ?? 0).toString());
        setFreeShippingMin((s.freeShippingMin ?? 0).toString());
      }
      if (logRes.data.success) {
        setAuditLogs(logRes.data.data || []);
      }
    } catch (err) {
      setError("Failed to retrieve system settings registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxRate || !shippingFee || !freeShippingMin) {
      alert("Please fill in all setting fields.");
      return;
    }

    setSaveLoading(true);
    try {
      const response = await api.put("/api/v1/admin/settings", {
        taxRate: parseFloat(taxRate),
        shippingFee: parseFloat(shippingFee),
        freeShippingMin: parseFloat(freeShippingMin)
      });
      if (response.data.success) {
        alert("System parameters updated successfully.");
        // Refresh logs
        const logRes = await api.get("/api/v1/admin/audit-logs");
        if (logRes.data.success) {
          setAuditLogs(logRes.data.data);
        }
      }
    } catch (err) {
      alert("Failed to update system parameters.");
    } finally {
      setSaveLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "var(--font-heading)", fontSize: "14px", color: "var(--color-text-secondary)" }}>
        LOADING SYSTEM PARAMETERS...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", margin: 0, fontWeight: 500 }}>Settings</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>
          Configure app-wide parameters and review administrative audit trails
        </p>
      </div>

      {error && (
        <div style={{ color: "var(--color-accent-red)", padding: "20px", backgroundColor: "#FFF5F5", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Two Column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "32px", alignItems: "start" }}>
        
        {/* Settings Form */}
        <div className="admin-card">
          <h2 style={{ fontSize: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <SettingsIcon size={18} /> Store Parameters
          </h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Standard Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="8.0"
                className="input-admin"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Standard Shipping Fee ($)</label>
              <input
                type="number"
                step="0.01"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                placeholder="9.99"
                className="input-admin"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Free Shipping Minimum ($)</label>
              <input
                type="number"
                step="0.01"
                value={freeShippingMin}
                onChange={(e) => setFreeShippingMin(e.target.value)}
                placeholder="100.00"
                className="input-admin"
                required
              />
            </div>

            <button type="submit" disabled={saveLoading} className="btn-admin-primary" style={{ marginTop: "8px" }}>
              {saveLoading ? "SAVING..." : "Save Parameters"}
            </button>
          </form>
        </div>

        {/* Audit Logs */}
        <div className="admin-card">
          <h2 style={{ fontSize: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldAlert size={18} /> Backoffice Audit Logs
          </h2>
          <div style={{
            maxHeight: "360px",
            overflowY: "auto",
            border: "1px solid var(--color-border-light)",
            backgroundColor: "white"
          }}>
            {!auditLogs || auditLogs.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "14px" }}>
                No audit entries recorded yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--color-border-light)",
                  fontSize: "13px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{log.action}</span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{log.createdAt ? formatDate(log.createdAt) : ""}</span>
                  </div>
                  <div style={{ color: "var(--color-text-secondary)" }}>{log.details}</div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                    IP: {log.ipAddress} | User ID: {log.adminId}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
