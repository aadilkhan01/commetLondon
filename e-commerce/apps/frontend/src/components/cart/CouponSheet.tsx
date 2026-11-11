"use client";

import { useState, useEffect } from "react";
import { X, Tag, Info } from "lucide-react";
import api from "@/lib/api";

export interface Coupon {
  id: string;
  code: string;
  discountPct: number;
  minOrderValue: number;
  maxDiscount: number;
  description: string;
}

interface CouponSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (coupon: Coupon) => void;
  cartSubtotal: number;
}

export default function CouponSheet({ isOpen, onClose, onApply, cartSubtotal }: CouponSheetProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCoupons();
    }
  }, [isOpen]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/cart/coupons");
      if (res.data.success) {
        setCoupons(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load coupons", err);
    }
    setLoading(false);
  };

  const calculateDiscount = (coupon: Coupon) => {
    if (cartSubtotal < coupon.minOrderValue) return 0;
    const discount = cartSubtotal * (coupon.discountPct / 100);
    return discount > coupon.maxDiscount ? coupon.maxDiscount : discount;
  };

  const handleCheck = () => {
    setError("");
    const found = coupons.find(c => c.code.toUpperCase() === inputCode.toUpperCase());
    if (!found) {
      setError("Invalid or expired coupon code");
      return;
    }
    if (cartSubtotal < found.minOrderValue) {
      setError(`Minimum order value of ₹${found.minOrderValue} required`);
      return;
    }
    setSelectedCoupon(found);
  };

  const handleApply = () => {
    if (selectedCoupon) {
      onApply(selectedCoupon);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div 
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#f5f5f6",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.3s ease-out forwards"
        }}
      >
        <div style={{ padding: "20px 16px", backgroundColor: "white", display: "flex", alignItems: "center", borderBottom: "1px solid var(--color-border-light)" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginRight: "16px", display: "flex" }}>
            <X size={20} />
          </button>
          <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--color-text-primary)", letterSpacing: "0.5px" }}>APPLY COUPON</span>
        </div>

        <div style={{ padding: "16px", backgroundColor: "white" }}>
          <div style={{ position: "relative", border: "1px solid var(--color-border)", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
            <input 
              type="text" 
              placeholder="Enter coupon code" 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              style={{ flex: 1, padding: "14px 16px", border: "none", fontSize: "14px", textTransform: "uppercase", outline: "none" }}
            />
            <button 
              onClick={handleCheck}
              style={{ padding: "0 16px", background: "none", border: "none", color: "#ff3f6c", fontWeight: 700, fontSize: "14px", cursor: inputCode ? "pointer" : "default", opacity: inputCode ? 1 : 0.5 }}
            >
              CHECK
            </button>
          </div>
          {error && <div style={{ color: "var(--color-accent-red)", fontSize: "12px", marginTop: "8px", fontWeight: 500 }}>{error}</div>}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--color-text-secondary)" }}>Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-secondary)", fontSize: "14px" }}>
              No other coupons available
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {coupons.map((coupon) => {
                const discount = calculateDiscount(coupon);
                const isEligible = cartSubtotal >= coupon.minOrderValue;
                const isSelected = selectedCoupon?.code === coupon.code;
                
                return (
                  <div key={coupon.code} style={{ backgroundColor: "white", borderRadius: "8px", padding: "16px", border: isSelected ? "1px solid #ff3f6c" : "1px solid var(--color-border-light)", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <input 
                        type="radio" 
                        name="coupon" 
                        checked={isSelected}
                        onChange={() => {
                          if (isEligible) {
                            setSelectedCoupon(coupon);
                            setInputCode(coupon.code);
                            setError("");
                          }
                        }}
                        disabled={!isEligible}
                        style={{ marginTop: "4px", accentColor: "#ff3f6c", width: "16px", height: "16px", cursor: isEligible ? "pointer" : "not-allowed", opacity: isEligible ? 1 : 0.5 }} 
                      />
                      <div style={{ flex: 1, opacity: isEligible ? 1 : 0.6 }}>
                        <div style={{ border: "1px dashed var(--color-border)", display: "inline-block", padding: "4px 8px", borderRadius: "4px", backgroundColor: "#fcfcfc", fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "8px" }}>
                          {coupon.code}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-accent-green)", marginBottom: "4px" }}>
                          Save ₹{discount > 0 ? discount.toFixed(2) : ((coupon.discountPct / 100) * coupon.minOrderValue).toFixed(2)}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                          {coupon.description}
                        </div>
                        {!isEligible && (
                          <div style={{ fontSize: "12px", color: "var(--color-accent-red)", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Info size={14} />
                            Add ₹{(coupon.minOrderValue - cartSubtotal).toFixed(2)} more to avail this offer
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: "white", borderTop: "1px solid var(--color-border-light)", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 600 }}>Maximum savings:</div>
            <div style={{ fontWeight: 700, fontSize: "18px", color: "var(--color-text-primary)" }}>
              ₹{selectedCoupon ? calculateDiscount(selectedCoupon).toFixed(0) : "0"}
            </div>
          </div>
          <button 
            onClick={handleApply}
            disabled={!selectedCoupon}
            style={{ padding: "12px 32px", backgroundColor: "#ff3f6c", color: "white", borderRadius: "4px", fontWeight: 700, fontSize: "14px", border: "none", cursor: selectedCoupon ? "pointer" : "not-allowed", opacity: selectedCoupon ? 1 : 0.5 }}
          >
            APPLY
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}
