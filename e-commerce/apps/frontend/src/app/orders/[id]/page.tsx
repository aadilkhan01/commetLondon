"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, Phone, MapPin, CreditCard, Bell, Box, HelpCircle, X, Info, ChevronRight, Check, XCircle } from "lucide-react";
import api from "@/lib/api";

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("HDFC Credit Card");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/api/v1/orders/${id}`);
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

    if (id) fetchOrder();
  }, [id]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f5f5f6" }}>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "var(--font-heading)" }}>
        LOADING ORDER...
      </div>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f5f5f6" }}>
      <div style={{ flex: 1, padding: "40px", color: "red", textAlign: "center" }}>
        {error || "Order not found."}
      </div>
    </div>
  );

  // For the sake of matching the mockup, we will render the first item prominently
  const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;

  return (
    <div style={{ backgroundColor: "#f2f4f7", minHeight: "100vh", paddingBottom: "80px", fontFamily: "var(--font-body)" }}>
      {/* Top Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", position: "sticky", top: 0, backgroundColor: "#f2f4f7", zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", display: "flex", marginLeft: "-8px" }}>
          <ArrowLeft size={24} color="#333" />
        </button>
        <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "white", border: "1px solid #e0e0e0", padding: "6px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
          <HelpCircle size={16} /> Help
        </button>
      </div>

      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Product Info Section */}
        {firstItem && (
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <div style={{ 
              width: "160px", height: "200px", margin: "0 auto 20px", 
              backgroundColor: "#d1d5db", borderRadius: "16px", overflow: "hidden",
              backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <img src={firstItem.image || "/placeholder.png"} alt={firstItem.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            
            <h1 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em", color: "#282c3f" }}>
              {firstItem.name.split(" ")[0] || "BRAND"}
            </h1>
            <p style={{ fontSize: "15px", color: "#535766", margin: "0 0 8px 0" }}>
              {firstItem.name}
            </p>
            <p style={{ fontSize: "14px", color: "#282c3f", margin: "0 0 8px 0" }}>
              Size: {firstItem.size || "8"} &nbsp;&middot;&nbsp; Quantity: {firstItem.quantity}
            </p>
            <p style={{ fontSize: "13px", color: "#535766", margin: "0" }}>
              Order ID: # {order.orderNumber}
            </p>
          </div>
        )}

        {/* Dynamic Status Banner */}
        {order.status === "DELIVERED" ? (
          <div style={{ backgroundColor: "#2b9a66", borderRadius: "12px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Box size={18} color="white" />
                Item Delivered
              </div>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px" }}>
                On {formatDate(order.updatedAt || order.createdAt)}
              </div>
            </div>
            {/* Decorative Stamp Graphic */}
            <div style={{ 
              position: "absolute", right: "-10px", top: "50%", transform: "translateY(-50%)",
              width: "80px", height: "80px", borderRadius: "50%",
              border: "4px dashed rgba(255,255,255,0.3)", display: "flex", justifyContent: "center", alignItems: "center",
              color: "rgba(255,255,255,0.4)", fontWeight: "bold", fontSize: "12px", transformOrigin: "center",
              textTransform: "uppercase", letterSpacing: "2px", zIndex: 1
            }}>
              <div style={{ transform: "rotate(-30deg)" }}>DELIVERED</div>
            </div>
          </div>
        ) : order.status === "CANCELLED" ? (
          <div style={{ backgroundColor: "#9ca3af", borderRadius: "12px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Box size={18} color="white" />
                Cancelled On {new Date(order.updatedAt || order.createdAt).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
              </div>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px" }}>
                As per your request
              </div>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #eaeaea", padding: "20px", position: "relative" }}>
            <div style={{ position: "absolute", left: "28px", top: "36px", bottom: "36px", width: "2px", backgroundColor: "#e5e7eb", zIndex: 0 }}></div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", position: "relative", zIndex: 1 }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#e5e7eb", border: "4px solid white", display: "flex", justifyContent: "center", alignItems: "center" }}></div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#1f2937" }}>
                Arriving <span style={{ color: "#2b9a66" }}>tomorrow</span> <span style={{ fontSize: "11px", color: "#ff3f6c", marginLeft: "4px", fontStyle: "italic", letterSpacing: "1px" }}>EXPRESS</span>
              </div>
            </div>
            
            <div style={{ backgroundColor: "#2b9a66", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white", marginBottom: "16px", position: "relative", zIndex: 1, boxShadow: "0 4px 12px rgba(43,154,102,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Box size={24} color="white" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px" }}>{order.status === "SHIPPED" ? "Shipped" : "Placed"}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.9)" }}>on {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</div>
                </div>
              </div>
              <ChevronRight size={20} color="white" />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#2b9a66", border: "2px solid white", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Check size={12} color="white" strokeWidth={3} />
              </div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#1f2937" }}>
                Order {order.status === "SHIPPED" ? "shipped" : "placed"} <span style={{ fontWeight: 400, color: "#6b7280" }}>on {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</span>
              </div>
            </div>

            {/* Prepay Banner for COD */}
            {order.paymentMethod === "COD" && (
              <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "16px", marginTop: "24px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "14px", color: "#4b5563", lineHeight: 1.4, maxWidth: "60%" }}>
                  Enjoy hassle-free delivery by pre-paying now.
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  style={{ backgroundColor: "#ff3f6c", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
                >
                  Pay Now
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #eaeaea", position: "relative", zIndex: 1 }}>
              <button style={{ flex: 1, padding: "12px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "13px", fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
                <MapPin size={16} /> Track Item
              </button>
              <button style={{ flex: 1, padding: "12px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "13px", fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
                <XCircle size={16} /> Cancel Item
              </button>
            </div>
          </div>
        )}

        {/* Write Review Card */}
        {order.status === "DELIVERED" && (
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ 
              width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#fff5e5", 
              display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0,
              fontSize: "24px"
            }}>
              🏆
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                {[1, 2, 3].map(i => <Star key={i} size={20} fill="#ff3f6c" color="#ff3f6c" />)}
                {[4, 5].map(i => <Star key={i} size={20} color="#d4d5d9" />)}
                <span style={{ marginLeft: "auto", color: "#ff3f6c", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Write Review</span>
              </div>
              <div style={{ fontSize: "13px", color: "#535766" }}>
                Review & get a chance to <span style={{ color: "#2b9a66", fontWeight: 600 }}>win MynCash!</span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery To Card */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {/* Name */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
            <div style={{ width: "48px", height: "48px", backgroundColor: "#e2e8f0", borderRadius: "8px", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px" }}>
              👨🏻‍💼
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#282c3f", marginBottom: "4px" }}>Delivery To</div>
              <div style={{ fontSize: "14px", color: "#535766" }}>{order.shippingAddress?.fullName || "User"}</div>
            </div>
          </div>
          
          <div style={{ height: "1px", backgroundColor: "#f1f1f1", marginBottom: "20px" }}></div>
          
          {/* Contact Details */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
            <Phone size={18} color="#535766" style={{ marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#282c3f", marginBottom: "4px" }}>Contact Details</div>
              <div style={{ fontSize: "14px", color: "#535766" }}>{order.shippingAddress?.phone || "N/A"}</div>
            </div>
          </div>

          {/* Delivery Address */}
          <div style={{ display: "flex", gap: "16px" }}>
            <MapPin size={18} color="#535766" style={{ marginTop: "2px" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#282c3f", marginBottom: "4px" }}>Delivery Address</div>
              <div style={{ fontSize: "14px", color: "#535766", lineHeight: 1.5 }}>
                {order.shippingAddress?.addressLine1} {order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress?.addressLine2}` : ""}
                <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
              </div>
            </div>
            <div style={{ width: "64px", height: "64px", borderRadius: "12px", backgroundColor: "#f0fdf4", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <MapPin size={32} color="#7c3aed" fill="#ede9fe" />
            </div>
          </div>
        </div>

        {/* Savings Banner */}
        {order.discount > 0 && (
          <div style={{ backgroundColor: "#f0fdf4", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", left: "-20px", top: "-20px", width: "100px", height: "100px", background: "radial-gradient(circle, rgba(134,239,172,0.3) 0%, rgba(134,239,172,0) 70%)" }}></div>
            <div style={{ width: "40px", height: "40px", backgroundColor: "#2b9a66", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1 }}>
              <span style={{ color: "white", fontWeight: "bold", fontSize: "18px" }}>%</span>
            </div>
            <div style={{ zIndex: 1 }}>
              <div style={{ fontSize: "14px", color: "#282c3f", marginBottom: "2px" }}>On this item you saved a total of</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#2b9a66" }}>{formatCurrency(order.discount)}</div>
            </div>
          </div>
        )}

        {/* Total Order Price */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div 
            onClick={() => setIsPaymentModalOpen(true)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", cursor: "pointer" }}
          >
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#282c3f" }}>Total Order Price</div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#282c3f", display: "flex", alignItems: "center", gap: "8px" }}>
              {formatCurrency(order.total)}
              <span style={{ color: order.status === "DELIVERED" ? "#2b9a66" : "#ff3f6c", fontSize: "12px", transform: isPaymentModalOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
            </div>
          </div>
          
          <div style={{ backgroundColor: "#f5f5f6", borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <CreditCard size={20} color="#535766" />
            <span style={{ fontSize: "14px", color: "#282c3f", fontWeight: 500 }}>
              Paid by {order.paymentMethod === "COD" ? "Cash on Delivery" : (order.paymentMethod || "Credit Card")}
            </span>
          </div>

          <div style={{ fontSize: "12px", color: "#7e818c", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
            Item sold by: RETAIL PARTNER PRIVATE LIMITED
          </div>

          <button style={{ width: "100%", padding: "14px", backgroundColor: "white", border: "1px solid #d4d5d9", borderRadius: "8px", fontWeight: 700, fontSize: "14px", color: "#282c3f", cursor: "pointer" }}>
            Get Invoice
          </button>
        </div>

        {/* Payment Information Modal */}
        {isPaymentModalOpen && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ backgroundColor: "white", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#1f2937" }}>Payment Information</h2>
                <button onClick={() => setIsPaymentModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}><X size={24} color="#6b7280" /></button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px", borderBottom: "1px dashed #e5e7eb", paddingBottom: "16px" }}>
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#4b5563" }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>
                      {item.quantity} x {item.name}
                    </div>
                    <div style={{ fontWeight: 600, color: "#1f2937" }}>{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                ))}
                
                {order.discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#4b5563" }}>
                    <div>Discount</div>
                    <div style={{ fontWeight: 600, color: "#1f2937" }}>-{formatCurrency(order.discount)}</div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", color: "#4b5563", marginBottom: "16px", borderBottom: "1px dashed #e5e7eb", paddingBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  Discounted Price <Info size={14} color="#6b7280" />
                </div>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "#1f2937" }}>{formatCurrency(order.subtotal - order.discount)}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px", borderBottom: "1px dashed #e5e7eb", paddingBottom: "24px" }}>
                {order.tax > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#4b5563" }}>
                    <div>Platform Fee / Tax</div>
                    <div style={{ fontWeight: 600, color: "#1f2937" }}>{formatCurrency(order.tax)}</div>
                  </div>
                )}
                {order.shippingCost > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#4b5563" }}>
                    <div>{order.paymentMethod === "COD" ? "Cash/Pay On Delivery" : "Shipping Cost"}</div>
                    <div style={{ fontWeight: 600, color: "#1f2937" }}>{formatCurrency(order.shippingCost)}</div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "#1f2937" }}>Total Paid</div>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "#1f2937" }}>{formatCurrency(order.total)}</div>
              </div>

              <div style={{ backgroundColor: "#f9fafb", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ backgroundColor: "white", padding: "6px", borderRadius: "6px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <CreditCard size={18} color="#4b5563" />
                </div>
                <span style={{ fontSize: "14px", color: "#374151" }}>
                  {order.paymentMethod === "COD" ? "Pay on delivery." : `Paid via ${order.paymentMethod || "Credit Card"}.`}
                </span>
              </div>

              <button style={{ width: "100%", padding: "14px", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "8px", fontWeight: 700, fontSize: "14px", color: "#1f2937", cursor: "pointer", letterSpacing: "0.05em" }}>
                GET INVOICE
              </button>
            </div>
          </div>
        )}

        {/* Updates sent to */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#f5f5f6", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Bell size={18} color="#282c3f" />
            </div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#282c3f" }}>Updates sent to</div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#7e818c", marginBottom: "4px" }}>Call</div>
              <div style={{ fontSize: "14px", color: "#282c3f", fontWeight: 500 }}>{order.shippingAddress?.phone || "N/A"}</div>
            </div>
            <div style={{ textAlign: "left", flex: 0.6 }}>
              <div style={{ fontSize: "12px", color: "#7e818c", marginBottom: "4px" }}>Email</div>
              <div style={{ fontSize: "14px", color: "#282c3f", fontWeight: 500, wordBreak: "break-all" }}>{order.email || "user@example.com"}</div>
            </div>
          </div>
        </div>

        {/* Order details */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#f5f5f6", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Box size={18} color="#282c3f" />
            </div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#282c3f" }}>Order details</div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#7e818c", marginBottom: "4px" }}>Ordered On</div>
              <div style={{ fontSize: "14px", color: "#282c3f", fontWeight: 500 }}>{formatShortDate(order.createdAt)}</div>
            </div>
            <div style={{ textAlign: "left", flex: 0.6 }}>
              <div style={{ fontSize: "12px", color: "#7e818c", marginBottom: "4px" }}>Order ID</div>
              <div style={{ fontSize: "14px", color: "#282c3f", fontWeight: 500 }}># {order.orderNumber}</div>
            </div>
          </div>
        </div>

      </main>

      {/* Pre Pay Confirmation Modal */}
      {isPaymentModalOpen && !isPaymentGatewayOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ backgroundColor: "white", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px 0", color: "#1f2937" }}>Pre pay for your order</h2>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Pay now to enjoy a cashless & hassle free delivery experience</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                <X size={24} color="#6b7280" />
              </button>
            </div>
            
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>Paying For {order.items.length} Item(s)</div>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ width: "64px", height: "80px", backgroundColor: "#f3f4f6", borderRadius: "8px", overflow: "hidden" }}>
                  <img src={firstItem.image || "/placeholder.png"} alt={firstItem.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "#1f2937", marginBottom: "4px" }}>{firstItem.name.split(" ")[0] || "BRAND"}</div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>{firstItem.name}</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsPaymentGatewayOpen(true)}
              style={{ width: "100%", backgroundColor: "#ff3f6c", color: "white", padding: "14px", borderRadius: "8px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer" }}
            >
              Pay Now: {formatCurrency(order.total)}
            </button>
          </div>
        </div>
      )}

      {/* Mock Payment Gateway Modal */}
      {isPaymentGatewayOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "#f5f5f6", zIndex: 1100, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* Header */}
          <div style={{ backgroundColor: "white", padding: "16px", display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 10 }}>
            <button onClick={() => setIsPaymentGatewayOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
              <ArrowLeft size={24} color="#1f2937" />
            </button>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#1f2937", flex: 1 }}>Payments</div>
          </div>

          {/* Timer */}
          <div style={{ backgroundColor: "#059669", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Complete payment in
            </div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>14 min 35 sec</div>
          </div>

          <div style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", backgroundColor: "#f5f5f6" }}>
            SAVED PAYMENT OPTIONS
          </div>

          {/* Saved Cards */}
          <div style={{ backgroundColor: "white" }}>
            <label style={{ display: "block", padding: "20px 16px", borderBottom: "1px solid #e5e7eb", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <input type="radio" name="paymentOption" checked={selectedPaymentOption === "HDFC"} onChange={() => setSelectedPaymentOption("HDFC")} style={{ marginTop: "4px", accentColor: "#ff3f6c", width: "18px", height: "18px" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#1f2937" }}>HDFC Credit Card</div>
                    <div style={{ fontWeight: 700, color: "#1a1e51", fontStyle: "italic" }}>VISA</div>
                  </div>
                  <div style={{ fontSize: "14px", color: "#4b5563", marginBottom: "12px" }}>**** 0508</div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.4 }}>
                    281FCDFA-1974-41D3-8DBA-AB3444FFF4B1 cards do not require a CVV as per RBI guidelines.
                  </div>
                  {selectedPaymentOption === "HDFC" && (
                    <button style={{ width: "100%", backgroundColor: "#ff3f6c", color: "white", padding: "12px", borderRadius: "4px", border: "none", fontWeight: 700, fontSize: "15px", marginTop: "16px", cursor: "pointer" }}>
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            </label>

            <label style={{ display: "block", padding: "20px 16px", borderBottom: "1px solid #e5e7eb", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <input type="radio" name="paymentOption" checked={selectedPaymentOption === "AXIS"} onChange={() => setSelectedPaymentOption("AXIS")} style={{ marginTop: "4px", accentColor: "#ff3f6c", width: "18px", height: "18px" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#1f2937" }}>AXIS Credit Card</div>
                    <div style={{ display: "flex" }}>
                      <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#eb001b", zIndex: 1 }}></div>
                      <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#f79e1b", marginLeft: "-8px" }}></div>
                    </div>
                  </div>
                  <div style={{ fontSize: "14px", color: "#4b5563" }}>**** 7087</div>
                  {selectedPaymentOption === "AXIS" && (
                    <button style={{ width: "100%", backgroundColor: "#ff3f6c", color: "white", padding: "12px", borderRadius: "4px", border: "none", fontWeight: 700, fontSize: "15px", marginTop: "16px", cursor: "pointer" }}>
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            </label>
          </div>

          <div style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", backgroundColor: "#f5f5f6" }}>
            ONLINE PAYMENT OPTIONS
          </div>

          <div style={{ backgroundColor: "white", marginBottom: "100px" }}>
            {["Credit/Debit Card", "PhonePe/Google Pay/BHIM UPI", "Paytm/Wallets", "Net Banking"].map((opt) => (
              <div key={opt} style={{ padding: "20px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <CreditCard size={20} color="#4b5563" />
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "#1f2937" }}>{opt}</div>
                </div>
                <ChevronRight size={20} color="#9ca3af" style={{ transform: "rotate(90deg)" }} />
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "white", borderTop: "1px solid #e5e7eb", padding: "16px", boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#1f2937" }}>Price Details</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "#9ca3af" }}>Total Amount:</span>
                <span style={{ fontWeight: 700, fontSize: "16px", color: "#1f2937" }}>{formatCurrency(order.total)}</span>
                <ChevronRight size={20} color="#1f2937" style={{ transform: "rotate(-90deg)" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
