// Force rebuild
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowLeft, ShieldCheck, Truck, Shield, X, AlertCircle, Tag, ChevronRight } from "lucide-react";
import CouponSheet, { Coupon } from "./CouponSheet";
import { useCartStore, useAuthStore, useWishlistStore } from "@/store";
import api from "@/lib/api";

export default function CartClient() {
  const { items, updateQuantity, removeItem, setItems, toggleSelectItem, getSubtotal } = useCartStore();
  const { toggleWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [showCouponSheet, setShowCouponSheet] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  
  useEffect(() => { setMounted(true); }, []);

  // Fetch real-time stock
  const refreshStock = useCallback(async () => {
    if (items.length === 0) return;
    try {
      const itemsWithSlug = items.filter((item) => item.slug);
      if (itemsWithSlug.length === 0) return;

      const stockChecks = await Promise.allSettled(
        itemsWithSlug.map((item) =>
          api.get(`/api/v1/products/${item.slug}`).then((res) => ({
            productId: item.productId,
            stock: res.data.data?.stock,
            price: res.data.data?.price,
          }))
        )
      );
      const dataMap = new Map(
        stockChecks
          .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
          .map((r) => [r.value.productId, { stock: r.value.stock, price: r.value.price }])
      );
      const updated = items.map((item) => {
        const freshData = dataMap.get(item.productId);
        if (freshData !== undefined) {
          return { 
            ...item, 
            stock: freshData.stock,
            price: freshData.price !== undefined ? freshData.price : item.price
          };
        }
        return item;
      });
      
      // Only trigger re-render if something actually changed to prevent infinite loops
      const hasChanges = updated.some((u, i) => u.stock !== items[i].stock || u.price !== items[i].price);
      if (hasChanges) {
        setItems(updated);
      }
    } catch {
      // silently fail
    }
  }, [items, setItems]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mounted && items.length > 0) {
      refreshStock();
    }
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;

  const isOutOfStock = (item: typeof items[0]) => item.stock !== undefined && item.stock <= 0;
  
  const selectedItems = items.filter((item) => item.selected !== false);
  const hasOutOfStockItems = selectedItems.some(isOutOfStock);
  const subtotal = getSubtotal();
  const totalMRP = selectedItems.reduce((sum, item) => sum + ((item.price * 1.2) * item.quantity), 0); // Fake MRP for visual
  const discountOnMRP = totalMRP - subtotal;
  const platformFee = 23;

  let couponDiscount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minOrderValue) {
    couponDiscount = subtotal * (appliedCoupon.discountPct / 100);
    if (couponDiscount > appliedCoupon.maxDiscount) couponDiscount = appliedCoupon.maxDiscount;
  }
  
  const finalTotal = subtotal - couponDiscount + (selectedItems.length > 0 ? platformFee : 0);

  const handlePlaceOrder = () => {
    if (hasOutOfStockItems) {
      setShowOutOfStockModal(true);
      return;
    }
    if (selectedItems.length === 0) {
      alert("Please select at least one item to proceed.");
      return;
    }
    router.push("/checkout/address");
  };

  return (
    <div style={{ backgroundColor: "#f5f5f6" }}>
      {/* Header / Progress Bar (Full Width) */}
      <div style={{ backgroundColor: "var(--color-bg-white)", borderBottom: "1px solid var(--color-border-light)", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container-main" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "78px" }}>
          {/* Left: Logo/Back */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 20px 10px" }}>
           <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
           <ArrowLeft size={20} />
           </button>
           <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", letterSpacing: "0.08em", margin: 0 }}>
          Shopping Bag
           </h1>
         </div>

          {/* Center: Progress Bar (Desktop) */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: "12px", fontFamily: "var(--font-heading)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em" }}>
            <span style={{ color: "var(--color-accent-green)", borderBottom: "2px solid var(--color-accent-green)", paddingBottom: "4px" }}>BAG</span>
            <span style={{ color: "var(--color-border)", letterSpacing: "2px" }}>--------</span>
            <span style={{ color: "var(--color-text-muted)" }}>ADDRESS</span>
            <span style={{ color: "var(--color-border)", letterSpacing: "2px" }}>--------</span>
            <span style={{ color: "var(--color-text-muted)" }}>PAYMENT</span>
          </div>

          {/* Mobile: Simple title */}
          <div className="md:hidden" style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.1em" }}>
            STEP 1/3
          </div>

          {/* Right: Secure */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-accent-green)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em" }}>
            <ShieldCheck size={20} strokeWidth={2} />
            <span className="hidden md:inline">100% SECURE</span>
          </div>
        </div>
      </div>

      <div className="container-main container-submain" style={{ paddingTop: "32px" }}>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <ShoppingBag size={64} strokeWidth={1} style={{ color: "var(--color-text-muted)", margin: "0 auto 24px" }} />
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "16px", letterSpacing: "0.1em", marginBottom: "8px" }}>YOUR BAG IS EMPTY</p>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "32px" }}>Looks like you haven&apos;t added anything to your bag yet.</p>
          <Link href="/shop" className="btn-primary" style={{ padding: "16px 40px", fontSize: "13px" }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ gap: "32px", width: "100%" }} className="flex flex-col lg:flex-row">
          
          {/* Left Column: Items */}
          <div style={{ flex: "1 1 65%" }}>
            
            {/* Delivery address hint */}
            {isAuthenticated && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: "var(--color-bg-white)", borderRadius: "8px", border: "1px solid var(--color-border-light)", marginBottom: "20px" }}>
                <div>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>Deliver to: <strong>Your Default Address</strong></p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>We will confirm delivery details in the next step.</p>
                </div>
              </div>
            )}

            {/* Selection Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "0 4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }}>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {selectedItems.length}/{items.length} ITEMS SELECTED 
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>(${subtotal.toFixed(2)})</span>
              </div>
            </div>

            {/* Items List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {items.map((item) => (
                <div key={item.productId + '-' + (item.color || '')} style={{ display: "flex", gap: "16px", padding: "20px", backgroundColor: "var(--color-bg-white)", borderRadius: "12px", border: "1px solid var(--color-border-light)", opacity: isOutOfStock(item) ? 0.6 : 1, position: "relative" }}>
                  
                  {/* Select/Deselect Checkbox */}
                  <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 10 }}>
                    <input
                      type="checkbox"
                      checked={item.selected !== false}
                      onChange={() => toggleSelectItem(item.productId, item.color)}
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "var(--color-accent-red)",
                        cursor: "pointer"
                      }}
                    />
                  </div>
                  
                  {/* Image */}
                  <div style={{ position: "relative", width: "110px", height: "140px", flexShrink: 0, marginLeft: "32px" }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", backgroundColor: "var(--color-bg-cream)", borderRadius: "6px" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", backgroundColor: "var(--color-bg-cream)", borderRadius: "6px" }} />
                    )}
                    {isOutOfStock(item) && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ color: "var(--color-accent-red)", fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-heading)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-primary)", lineHeight: 1.3 }}>{item.name}</p>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "12px", marginBottom: "8px" }}>Sold by: GoCarry Retail</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.color)}
                        style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {item.color && (
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginBottom: "12px" }}>
                        Color: {item.color}
                      </p>
                    )}

                    {/* Size and Qty Selectors visually */}
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                      {!isOutOfStock(item) && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "var(--color-bg-primary)", padding: "4px 12px", borderRadius: "4px", fontSize: "13px", fontWeight: 500 }}>
                          Qty: 
                          <select 
                            value={item.quantity} 
                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value), item.color)}
                            style={{ background: "transparent", border: "none", outline: "none", cursor: "pointer", fontWeight: 600 }}
                          >
                            {[1,2,3].map(n => (
                              <option key={n} value={n} disabled={n > (item.stock ?? 3)}>{n}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "auto" }}>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>₹{item.price.toFixed(2)}</span>
                      <span style={{ fontSize: "13px", color: "var(--color-text-muted)", textDecoration: "line-through" }}>₹{(item.price * 1.2).toFixed(2)}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-accent-green)" }}>20% OFF</span>
                    </div>

                    <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                       14 days return available
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Price Details */}
          <div style={{ flex: "1 1 35%" }}>
            {/* COUPONS SECTION */}
            <div style={{ padding: "0 0 16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "16px", letterSpacing: "0.5px" }}>
                COUPONS
              </div>
              <div 
                onClick={() => setShowCouponSheet(true)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", cursor: "pointer", borderBottom: "1px solid var(--color-border-light)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Tag size={20} color="var(--color-text-primary)" strokeWidth={1.5} />
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>Apply Coupon</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {appliedCoupon && (
                    <span style={{ fontSize: "12px", color: "var(--color-accent-green)", fontWeight: 700 }}>
                      - ₹{couponDiscount.toFixed(2)}
                    </span>
                  )}
                  <ChevronRight size={18} color="var(--color-text-secondary)" />
                </div>
              </div>
            </div>

            <div style={{ padding: "24px", backgroundColor: "var(--color-bg-white)", borderRadius: "12px", border: "1px solid var(--color-border-light)", marginBottom: "40px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "20px", fontFamily: "var(--font-body)", letterSpacing: "normal", textTransform: "uppercase" }}>
                PRICE DETAILS ({selectedItems.length} Item{selectedItems.length !== 1 && 's'})
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px", color: "var(--color-text-primary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total MRP</span>
                  <span>₹{totalMRP.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Discount on MRP</span>
                  <span style={{ color: "var(--color-accent-green)" }}>- ₹{discountOnMRP.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Coupon Discount</span>
                    <span style={{ color: "var(--color-accent-green)" }}>- ₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Platform Fee</span>
                  <span>₹{platformFee.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "20px", borderTop: "1px dashed var(--color-border)", fontSize: "16px", fontWeight: 700 }}>
                <span>Total Amount</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>

              <div style={{ marginTop: "32px", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--color-border-light)", paddingTop: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <Shield size={24} strokeWidth={1} color="var(--color-text-secondary)" />
                  <span style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>Genuine Products</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <Truck size={24} strokeWidth={1} color="var(--color-text-secondary)" />
                  <span style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>Contactless Delivery</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <ShieldCheck size={24} strokeWidth={1} color="var(--color-text-secondary)" />
                  <span style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>Secure Payments</span>
                </div>
              </div>

              {/* Desktop Place Order Button */}
              <button 
                onClick={handlePlaceOrder}
                className="hidden md:flex" 
                style={{ width: "100%", marginTop: "32px", padding: "16px", fontSize: "14px", backgroundColor: "var(--color-bg-dark)", color: "white", borderRadius: "4px", fontWeight: 700, border: "none", cursor: selectedItems.length > 0 ? "pointer" : "not-allowed", justifyContent: "center" }}
                disabled={selectedItems.length === 0}
              >
                PLACE ORDER
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Mobile Sticky Bottom Bar */}
      {items.length > 0 && (
        <div 
          className="flex flex-col md:hidden" 
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "var(--color-bg-white)",
            borderTop: "1px solid var(--color-border-light)",
            padding: "12px 16px",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
            gap: "8px",
            zIndex: 100,
            boxShadow: "0 -4px 12px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
            {selectedItems.length} Item{selectedItems.length !== 1 && 's'} selected for order
          </div>
          <button 
            onClick={handlePlaceOrder}
            style={{ 
              width: "100%", 
              backgroundColor: selectedItems.length > 0 ? "var(--color-bg-dark)" : "var(--color-border)", 
              color: "white", 
              border: "none", 
              padding: "14px", 
              borderRadius: "4px", 
              fontWeight: 700,
              fontSize: "14px",
              cursor: selectedItems.length > 0 ? "pointer" : "not-allowed",
              letterSpacing: "0.05em",
            }}
            disabled={selectedItems.length === 0}
          >
            PLACE ORDER
          </button>
        </div>
      )}
      </div>

      {showOutOfStockModal && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setShowOutOfStockModal(false)}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999 }}
          />
          {/* Bottom Sheet */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, 
            backgroundColor: "white", 
            borderTopLeftRadius: "16px", borderTopRightRadius: "16px",
            zIndex: 1000,
            animation: "slideUp 0.3s ease-out forwards",
            display: "flex", flexDirection: "column"
          }}>
            {/* Header */}
            <div style={{ padding: "24px 24px 20px", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ position: "relative" }}>
                  <ShoppingBag size={24} color="#3e4152" strokeWidth={1.5} />
                  <div style={{ position: "absolute", bottom: -2, right: -4, backgroundColor: "white", borderRadius: "50%", padding: "1px" }}>
                    <AlertCircle size={14} color="#ff5722" fill="#ff5722" style={{ color: "white" }} />
                  </div>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#3e4152", margin: 0, fontFamily: "var(--font-heading)" }}>Move Out Of Stock Items</h3>
              </div>
              
              <button 
                onClick={() => setShowOutOfStockModal(false)}
                style={{ position: "absolute", top: "24px", right: "24px", background: "none", border: "none", cursor: "pointer", color: "#3e4152", padding: 0 }}
              >
                <X size={24} strokeWidth={1.5} />
              </button>
              
              <p style={{ fontSize: "14px", color: "#3e4152", margin: 0, lineHeight: 1.5 }}>
                Item(s) in your bag are out of stock. Please move them from bag to proceed.
              </p>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #eaeaec", margin: "0 24px" }} />

            {/* List of items */}
            <div style={{ padding: "20px 24px", maxHeight: "40vh", overflowY: "auto" }}>
              {selectedItems.filter(isOutOfStock).map((item, idx) => (
                <div key={item.productId} style={{ display: "flex", gap: "16px", marginBottom: idx !== selectedItems.filter(isOutOfStock).length - 1 ? "20px" : 0 }}>
                  <div style={{ width: "52px", height: "68px", flexShrink: 0, backgroundColor: "#f5f5f6" }}>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#3e4152", marginBottom: "4px" }}>
                      {item.brand || "BRAND"}
                    </div>
                    <div style={{ fontSize: "14px", color: "#535766" }}>
                      {item.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #eaeaec", margin: 0 }} />

            {/* Actions */}
            <div style={{ display: "flex" }}>
              <button 
                onClick={() => {
                  const outOfStock = selectedItems.filter(isOutOfStock);
                  outOfStock.forEach(item => toggleSelectItem(item.productId, item.color));
                  setShowOutOfStockModal(false);
                }}
                style={{ flex: 1, padding: "16px", background: "white", color: "#535766", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer", borderRight: "1px solid #eaeaec" }}
              >
                UNSELECT ITEMS
              </button>
              <button 
                onClick={() => {
                  const outOfStock = selectedItems.filter(isOutOfStock);
                  outOfStock.forEach(item => {
                    toggleWishlist(item.productId);
                    removeItem(item.productId, item.color);
                  });
                  setShowOutOfStockModal(false);
                }}
                style={{ flex: 1, padding: "16px", background: "white", color: "#ff3f6c", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer" }}
              >
                MOVE TO WISHLIST
              </button>
            </div>
          </div>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>
        </>
      )}

      {/* Coupon Sheet */}
      <CouponSheet 
        isOpen={showCouponSheet} 
        onClose={() => setShowCouponSheet(false)} 
        onApply={(coupon) => setAppliedCoupon(coupon)} 
        cartSubtotal={subtotal} 
      />
    </div>
  );
}
