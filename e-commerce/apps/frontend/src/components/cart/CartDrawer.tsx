"use client";

import { X, Minus, Plus, ShoppingBag, AlertTriangle } from "lucide-react";
import { useCartStore, useAuthStore } from "@/store";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, setItems, toggleSelectItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [showOosPopup, setShowOosPopup] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync cart from server when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      api.get("/api/v1/cart").then((res) => {
        if (res.data.success && res.data.data?.cart?.items) {
          useCartStore.getState().setItems(res.data.data.cart.items);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  // Fetch real-time stock for cart items whenever the drawer opens
  const refreshStock = useCallback(async () => {
    if (items.length === 0) return;
    try {
      const itemsWithSlug = items.filter((item) => item.slug);
      if (itemsWithSlug.length === 0) return;

      const stockChecks = await Promise.all(
        itemsWithSlug.map((item) =>
          api.get(`/api/v1/products/${item.slug}`).then((res) => ({
            productId: item.productId,
            stock: res.data.data?.stock,
          })).catch(() => ({ productId: item.productId, stock: undefined }))
        )
      );
      const stockMap = new Map(stockChecks.map((s) => [s.productId, s.stock]));
      const updated = items.map((item) => {
        const freshStock = stockMap.get(item.productId);
        return freshStock !== undefined ? { ...item, stock: freshStock } : item;
      });
      setItems(updated);
    } catch {
      // silently fail
    }
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen && items.length > 0) {
      refreshStock();
    }
    if (!isOpen) {
      setShowOosPopup(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;

  const selectedItems = items.filter((item) => item.selected !== false);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isOutOfStock = (item: typeof items[0]) => item.stock !== undefined && item.stock <= 0;
  const outOfStockItems = selectedItems.filter(isOutOfStock);
  const hasOutOfStockItems = outOfStockItems.length > 0;

  const handleCheckoutClick = () => {
    if (hasOutOfStockItems) {
      setShowOosPopup(true);
    }
  };

  return (
    <>
      <div className={`cart-drawer-overlay ${isOpen ? "open" : ""}`} onClick={closeCart} />
      <div className={`cart-drawer ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--color-border-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingBag size={18} strokeWidth={1.5} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "13px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Cart ({items.length})
            </span>
          </div>
          <button onClick={closeCart} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <ShoppingBag size={48} strokeWidth={1} style={{ color: "var(--color-text-muted)", margin: "0 auto 16px" }} />
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "14px", letterSpacing: "0.1em", marginBottom: "8px" }}>YOUR CART IS EMPTY</p>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "24px" }}>Looks like you haven&apos;t added anything yet.</p>
              <Link href="/shop" onClick={closeCart} className="btn-primary" style={{ display: "inline-flex" }}>
                Start Shopping
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId + '-' + (item.color || '')} style={{ display: "flex", gap: "16px", padding: "16px 0", borderBottom: "1px solid var(--color-border-light)", opacity: isOutOfStock(item) ? 0.6 : 1, alignItems: "center" }}>
                {/* Select/Deselect Checkbox */}
                <div style={{ display: "flex", alignItems: "center", paddingRight: "4px" }}>
                  <input
                    type="checkbox"
                    checked={item.selected !== false}
                    onChange={() => toggleSelectItem(item.productId, item.color)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "var(--color-bg-dark)",
                      cursor: "pointer"
                    }}
                  />
                </div>
                
                <div style={{ position: "relative", width: "80px", height: "100px", flexShrink: 0 }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", backgroundColor: "var(--color-bg-cream)" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", backgroundColor: "var(--color-bg-cream)" }} />
                  )}
                  {isOutOfStock(item) && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ color: "white", fontSize: "9px", fontFamily: "var(--font-heading)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Out of Stock</span>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px", lineHeight: 1.3 }}>{item.name}</p>
                    {item.color && (
                      <p style={{ color: "var(--color-text-muted)", fontSize: "11px", fontFamily: "var(--font-heading)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>
                        COLOR: {item.color}
                      </p>
                    )}
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>${item.price.toFixed(2)}</p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {/* Quantity Controls */}
                    {!isOutOfStock(item) ? (
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-border)", height: "32px" }}>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.color)}
                          style={{ width: "32px", height: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ width: "32px", textAlign: "center", fontSize: "13px", fontFamily: "var(--font-heading)" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.color)}
                          style={{ width: "32px", height: "100%", background: "none", border: "none", cursor: item.quantity >= 3 || item.quantity >= (item.stock ?? Infinity) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: item.quantity >= 3 || item.quantity >= (item.stock ?? Infinity) ? 0.3 : 1 }}
                          disabled={item.quantity >= 3 || item.quantity >= (item.stock ?? Infinity)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "var(--color-accent-red)", fontSize: "12px", fontWeight: "bold" }}>Out of Stock</span>
                    )}

                    <button
                      onClick={() => removeItem(item.productId, item.color)}
                      style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: "20px 24px", borderTop: "1px solid var(--color-border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>Subtotal</span>
              <span style={{ fontSize: "16px", fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
              Shipping & taxes calculated at checkout
            </p>

            {selectedItems.length === 0 ? (
              <button disabled className="btn-primary" style={{ display: "flex", width: "100%", justifyContent: "center", opacity: 0.5, cursor: "not-allowed" }}>
                Select Items to Checkout
              </button>
            ) : hasOutOfStockItems ? (
              <button onClick={handleCheckoutClick} className="btn-primary" style={{ display: "flex", width: "100%", justifyContent: "center" }}>
                Checkout
              </button>
            ) : isAuthenticated ? (
              <Link href="/checkout" onClick={closeCart} className="btn-primary" style={{ display: "flex", width: "100%", justifyContent: "center" }}>
                Checkout
              </Link>
            ) : (
              <Link href="/login?redirect=/checkout" onClick={closeCart} className="btn-primary" style={{ display: "flex", width: "100%", justifyContent: "center" }}>
                Sign In to Checkout
              </Link>
            )}
          </div>
        )}

        {/* Out of Stock Bottom Popup */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderTop: "1px solid var(--color-border)",
            boxShadow: "0 -8px 30px rgba(0,0,0,0.15)",
            borderRadius: "16px 16px 0 0",
            transform: showOosPopup ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
            zIndex: 10,
            maxHeight: "70%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Popup Header */}
          <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid var(--color-border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <AlertTriangle size={20} style={{ color: "var(--color-accent-red)", marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "14px", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                    Remove out of stock items
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                    Items in your bag are out of stock. Please remove them from the bag to proceed.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowOosPopup(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0 }}>
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Popup Items */}
          <div style={{ overflowY: "auto", padding: "12px 24px" }}>
            {outOfStockItems.map((item) => (
              <div key={item.productId + '-' + (item.color || '')} style={{ display: "flex", gap: "12px", padding: "12px 0", borderBottom: "1px solid var(--color-border-light)", alignItems: "center" }}>
                <div style={{ width: "48px", height: "48px", flexShrink: 0, borderRadius: "6px", overflow: "hidden", backgroundColor: "var(--color-bg-cream)" }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", backgroundColor: "var(--color-bg-cream)" }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                  {item.color && (
                    <p style={{ color: "var(--color-text-muted)", fontSize: "10px", fontFamily: "var(--font-heading)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Color: {item.color}</p>
                  )}
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>${item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => {
                    removeItem(item.productId, item.color);
                    // Close popup if no more OOS items
                    const remaining = outOfStockItems.filter(i => !(i.productId === item.productId && (i.color || "") === (item.color || "")));
                    if (remaining.length === 0) setShowOosPopup(false);
                  }}
                  style={{
                    background: "none", border: "1px solid var(--color-border)", borderRadius: "4px",
                    padding: "6px 12px", fontSize: "11px", fontFamily: "var(--font-heading)",
                    letterSpacing: "0.08em", cursor: "pointer", textTransform: "uppercase",
                    color: "var(--color-accent-red)", flexShrink: 0,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
