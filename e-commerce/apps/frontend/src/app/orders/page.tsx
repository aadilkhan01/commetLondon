"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, ArrowDown, ArrowUp, Box, ChevronRight, MapPin, XCircle, HelpCircle, RotateCcw, X, Check, Star, Camera } from "lucide-react";
import api from "@/lib/api";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Order } from "@/types";

export default function AllOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [activeTab, setActiveTab] = useState<string>("this_year");
  const [startDate, setStartDate] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelComments, setCancelComments] = useState("");

  const [reviewingItem, setReviewingItem] = useState<any>(null);
  const [reviewingProductId, setReviewingProductId] = useState<string>("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);

  const minTime = new Date("2020-01-01").getTime();
  const maxTime = new Date().getTime();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    if (tab === "all") {
      setStartDate("2020-01-01");
      setEndDate(todayStr);
    } else if (tab === "last_month") {
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      setStartDate(lastMonth.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (tab === "last_6_months") {
      const last6 = new Date();
      last6.setMonth(today.getMonth() - 6);
      setStartDate(last6.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (tab === "this_year") {
      setStartDate(`${today.getFullYear()}-01-01`);
      setEndDate(todayStr);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  useEffect(() => {
    const fetchOrdersAndReviews = async () => {
      try {
        const [ordersRes, reviewsRes] = await Promise.all([
          api.get(`/api/v1/orders`),
          api.get(`/api/v1/products/reviews/me`).catch(() => ({ data: { success: false, data: [] } }))
        ]);
        
        let fetchedOrders = [];
        if (ordersRes.data.success) {
          fetchedOrders = ordersRes.data.data || [];
        } else {
          setError("Failed to fetch order history.");
        }

        // --- Mock Data Injection for Local Testing ---
        try {
          const storedOrderId = sessionStorage.getItem("lastOrderId");
          const storedAddressStr = sessionStorage.getItem("lastOrderAddress");
          const storedItemsStr = sessionStorage.getItem("lastOrderItems");
          
          if (storedOrderId && storedAddressStr && storedItemsStr) {
            // Check if it's already in fetchedOrders
            const alreadyExists = fetchedOrders.some((o: any) => o.id === storedOrderId);
            if (!alreadyExists) {
              const storedAddress = JSON.parse(storedAddressStr);
              const storedItems = JSON.parse(storedItemsStr);
              
              const mockOrder = {
                id: storedOrderId,
                status: "PLACED",
                createdAt: new Date().toISOString(),
                totalAmount: storedItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) + 23, // Adding platform fee roughly
                items: storedItems.map((item: any) => ({
                  id: item.productId,
                  product: {
                    name: item.name,
                    image: item.image,
                    brand: item.brand,
                  },
                  quantity: item.quantity,
                  price: item.price,
                  color: item.color,
                  size: item.size
                })),
                shippingAddress: storedAddress,
              };
              
              fetchedOrders = [mockOrder, ...fetchedOrders];
            }
          }
        } catch (e) {
          console.warn("Failed to parse local mock order", e);
        }
        
        setOrders(fetchedOrders);
        
        if (reviewsRes.data && reviewsRes.data.success) {
          setReviewedProductIds(reviewsRes.data.data || []);
        }
      } catch (err) {
        setError("Failed to communicate with services.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersAndReviews();
  }, [startDate, endDate]);

  const handleCancelSubmit = async () => {
    if (!cancellingOrder || !cancelReason) return;
    try {
      const res = await api.put(`/api/v1/orders/${cancellingOrder.id}/cancel`, { 
        reason: cancelReason,
        comments: cancelComments
      });
      if (res.data.success) {
        setOrders(orders.map(o => o.id === cancellingOrder.id ? { ...o, status: "CANCELLED" } : o));
        setCancellingOrder(null);
        setCancelReason("");
        setCancelComments("");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to cancel order.");
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewingProductId || reviewRating === 0 || !reviewComment) return;
    try {
      const res = await api.post(`/api/v1/products/${reviewingProductId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
        images: reviewImages
      });
      if (res.data.success) {
        setReviewedProductIds([...reviewedProductIds, reviewingProductId]);
        setReviewingItem(null);
        setReviewingProductId("");
        setReviewRating(0);
        setReviewComment("");
        setReviewImages([]);
        alert("Review submitted successfully! You earned ₹2000 Myntra Credit.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error?.message || "Failed to submit review.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setIsUploading(true);
    try {
      // Must use a direct fetch or axios instance that doesn't stringify the FormData
      const res = await api.post("/api/v1/products/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data.success && res.data.data.url) {
        // Construct full URL if needed, but relative URL is fine if images are loaded from the same domain
        // However, NEXT_PUBLIC_API_URL is where they are hosted.
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8083";
        // product-service runs on 8083, but api gateway is on 8080.
        // It's safer to store just the path and prefix it when rendering.
        // Wait, the API gateway currently doesn't proxy static files. Let's use the direct product-service URL.
        const imageUrl = `http://localhost:8083${res.data.data.url}`;
        setReviewImages([...reviewImages, imageUrl]);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return { bg: "rgba(46,125,50,0.1)", color: "var(--color-accent-green)" };
      case "CANCELLED": return { bg: "rgba(199,80,80,0.1)", color: "var(--color-accent-red)" };
      case "SHIPPED": return { bg: "rgba(25,118,210,0.1)", color: "#1976D2" };
      case "PLACED": return { bg: "rgba(245,124,0,0.1)", color: "#F57C00" };
      default: return { bg: "rgba(26,26,26,0.08)", color: "var(--color-text-primary)" };
    }
  };

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (startDate) {
      // Parse as local time 00:00:00
      const start = new Date(`${startDate}T00:00:00`).getTime();
      result = result.filter(o => {
        if (!o.createdAt) return true;
        const t = new Date(o.createdAt).getTime();
        return isNaN(t) || t >= start;
      });
    }

    if (endDate) {
      // Parse as local time 23:59:59.999
      const end = new Date(`${endDate}T23:59:59.999`).getTime();
      result = result.filter(o => {
        if (!o.createdAt) return true;
        const t = new Date(o.createdAt).getTime();
        return isNaN(t) || t <= end;
      });
    }

    result.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime() || 0;
      const timeB = new Date(b.createdAt || 0).getTime() || 0;
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [orders, sortOrder, startDate, endDate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fafafa" }}>
      {/* <Header /> */}
      
      <main style={{ flex: 1, maxWidth: "1200px", margin: "0 auto", padding: "40px 15px", width: "100%" }}>
        <div style={{ marginBottom: "32px" }}>
          {/* <Link href="/profile" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--color-text-secondary)", marginBottom: "16px", fontSize: "14px", fontFamily: "var(--font-heading)" }}>
            <ArrowLeft size={16} /> Back to Profile
          </Link> */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", margin: "0 0 8px 0" }}>
                  All Orders
                </h1>
                <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: "12px" }}>
                  View your complete order history
                </p>
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                
                {/* Date Filter Section */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-heading)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", flexWrap: "wrap" }}>
                  {activeTab !== "custom" ? (
                    <select
                      value={activeTab}
                      onChange={(e) => {
                        const tab = e.target.value;
                        if (tab === "custom") {
                          setActiveTab("custom");
                        } else {
                          handleTabChange(tab as any);
                        }
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "white",
                        color: "var(--color-text-primary)",
                        fontFamily: "var(--font-heading)",
                        fontSize: "12px",
                        cursor: "pointer",
                        outline: "none",
                        textTransform: "uppercase"
                      }}
                    >
                      {["all", "last_month", "last_6_months", "this_year", "custom"].map((tab) => (
                        <option key={tab} value={tab}>
                          {tab.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", backgroundColor: "white", padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>From:</label>
                        <input 
                          type="date" 
                          value={startDate} 
                          onChange={(e) => setStartDate(e.target.value)}
                          style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--color-border)", fontSize: "13px", fontFamily: "var(--font-heading)" }}
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>To:</label>
                        <input 
                          type="date" 
                          value={endDate} 
                          onChange={(e) => setEndDate(e.target.value)}
                          style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--color-border)", fontSize: "13px", fontFamily: "var(--font-heading)" }}
                        />
                      </div>
                      <button 
                        onClick={() => handleTabChange("this_year")}
                        style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "11px", marginLeft: "8px", fontWeight: 600 }}
                      >
                        ✕ CLEAR
                      </button>
                    </div>
                  )}
                </div>

                {/* Separated Sort Section */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "white", padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <label style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sort:</label>
                  <button 
                    onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                    style={{ 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "4px", borderRadius: "6px", border: "none", 
                      backgroundColor: "var(--color-bg-cream)", cursor: "pointer", transition: "all 0.2s"
                    }}
                    title={sortOrder === "desc" ? "Newest First" : "Oldest First"}
                  >
                    {sortOrder === "desc" ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", fontFamily: "var(--font-heading)", color: "var(--color-text-secondary)" }}>
            LOADING ORDERS...
          </div>
        ) : error ? (
          <div style={{ padding: "40px", color: "red", textAlign: "center", backgroundColor: "#FCE4E4", borderRadius: "12px", border: "1px solid #F5C6C6" }}>
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", backgroundColor: "white", borderRadius: "12px", border: "1px solid #eaeaea" }}>
            <Package size={48} strokeWidth={1} style={{ color: "var(--color-text-muted)", margin: "0 auto 16px" }} />
            <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", marginBottom: "8px" }}>No orders found</p>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "24px" }}>
              Looks like you haven't placed any orders yet.
            </p>
            <Link href="/shop" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
              START SHOPPING
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {filteredOrders.map((order) => {
              const isConfirmed = order.status === "PLACED" || order.status === "SHIPPED" || order.status === "DELIVERED";
              const isCancelled = order.status === "CANCELLED";

              return (
                <div key={order.id} style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #eaeaea", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                  {/* Card Header */}
                  <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", backgroundColor: isCancelled ? "#fef2f2" : "#f0fdf4", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
                      <Box size={20} color={isCancelled ? "#ef4444" : "#10b981"} />
                      {isCancelled && (
                        <div style={{ position: "absolute", bottom: "-2px", right: "-2px", backgroundColor: "#ef4444", borderRadius: "50%", padding: "2px" }}>
                          <XCircle size={10} color="white" fill="#ef4444" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "16px", color: isCancelled ? "#1f2937" : "#10b981" }}>
                        {isCancelled ? "Cancelled" : order.status}
                      </div>
                      <div style={{ fontSize: "13px", color: "#6b7280" }}>
                        {isConfirmed && order.status !== "DELIVERED" ? "Arriving Soon" : `on ${new Date(order.createdAt).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`}
                        {isCancelled && " As per your request"}
                      </div>
                    </div>
                  </div>

                  {/* Confirmed Banner */}
                  {isConfirmed && order.status !== "DELIVERED" && (
                    <div style={{ backgroundColor: "#e9d5ff", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 16px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937", flex: 1, paddingRight: "16px", lineHeight: "1.4" }}>
                        Enjoy hassle-free delivery by pre-paying now.
                      </div>
                      <button style={{ backgroundColor: "#ff477e", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 700, fontSize: "13px", cursor: "pointer", flexShrink: 0 }}>
                        Pay Now
                      </button>
                    </div>
                  )}

                  {/* Product items loop */}
                  <div style={{ padding: "16px" }}>
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} style={{ borderBottom: idx < order.items.length - 1 ? "1px solid #eaeaea" : "none", paddingBottom: idx < order.items.length - 1 ? "16px" : "0", marginBottom: idx < order.items.length - 1 ? "16px" : "0" }}>
                        <Link href={`/orders/${order.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: "16px", alignItems: "center", flex: 1 }}>
                            <div style={{ width: "64px", height: "80px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#f3f4f6", flexShrink: 0 }}>
                              <img src={item.image || "/placeholder.png"} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={item.name} />
                            </div>
                            <div style={{ flex: 1, overflow: "hidden" }}>
                              <div style={{ fontWeight: 700, fontSize: "15px", color: "#1f2937", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {item.name.split(" ")[0] || "BRAND"}
                              </div>
                              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: "13px", color: "#6b7280" }}>Size: {item.size || "M"}</div>
                            </div>
                          </div>
                          <ChevronRight size={20} color="#9ca3af" />
                        </Link>
                        {/* Buttons (Dynamic based on order status) */}
                        {!isCancelled && (
                          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                            {order.status === "DELIVERED" ? (
                              <>
                                <button style={{ flex: 1, padding: "8px 4px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}>
                                  <RotateCcw size={14} /> Return Item
                                </button>
                                {!reviewedProductIds.includes(item.productId) ? (
                                  <button onClick={(e) => { e.preventDefault(); setReviewingItem(item); setReviewingProductId(item.productId); }} style={{ flex: 1, padding: "8px 4px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}>
                                    <Star size={14} /> Write Review
                                  </button>
                                ) : (
                                  <button disabled style={{ flex: 1, padding: "8px 4px", backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", fontWeight: 500, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "not-allowed" }}>
                                    <Check size={14} /> Reviewed
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button onClick={(e) => { e.preventDefault(); setTrackingOrder(order); }} style={{ flex: 1, padding: "8px 4px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}>
                                  <MapPin size={14} /> Track Item
                                </button>
                                <button onClick={(e) => { e.preventDefault(); setCancellingOrder(order); }} style={{ flex: 1, padding: "8px 4px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}>
                                  <XCircle size={14} /> Cancel Item
                                </button>
                              </>
                            )}
                            <button style={{ flex: 1, padding: "8px 4px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}>
                              <HelpCircle size={14} /> Need Help?
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  {/* <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eaeaea", backgroundColor: "#f9fafb" }}>
                    <div style={{ fontSize: "13px", color: "#4b5563" }}>Who is this purchased for?</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={{ padding: "6px 12px", backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "16px", fontSize: "12px", color: "#374151", cursor: "pointer" }}>adil</button>
                      <button style={{ padding: "6px 12px", backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "16px", fontSize: "12px", color: "#374151", cursor: "pointer" }}>Add Profile</button>
                    </div>
                  </div> */}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Tracking Modal */}
      {trackingOrder && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ backgroundColor: "white", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#1f2937" }}>Track Item</h2>
              <button onClick={() => setTrackingOrder(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}><X size={24} color="#6b7280" /></button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0", position: "relative", marginLeft: "12px", paddingBottom: "24px" }}>
              {/* Line connecting the steps */}
              <div style={{ position: "absolute", left: "11px", top: "20px", bottom: "30px", width: "2px", backgroundColor: "#e5e7eb", zIndex: 0 }}></div>
              <div style={{ position: "absolute", left: "11px", top: "100px", bottom: "30px", width: "2px", backgroundColor: "#10b981", zIndex: 0 }}></div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "40px", position: "relative", zIndex: 1 }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#e5e7eb", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Check size={14} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "#1f2937", display: "flex", alignItems: "center", gap: "8px" }}>
                    Arriving <span style={{ fontWeight: 400, color: "#6b7280" }}>tomorrow</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "40px", position: "relative", zIndex: 1 }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#d1d5db", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Check size={14} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "#1f2937" }}>
                    Shipped <span style={{ fontWeight: 400, color: "#6b7280" }}>tomorrow</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", position: "relative", zIndex: 1 }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#10b981", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Check size={14} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "#10b981" }}>
                    Order Placed <span style={{ fontWeight: 400, color: "#6b7280" }}>on {new Date(trackingOrder.createdAt).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingOrder && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ backgroundColor: "white", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#1f2937" }}>Reason for cancellation</h2>
              <button onClick={() => setCancellingOrder(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}><X size={24} color="#6b7280" /></button>
            </div>
            <p style={{ fontSize: "13px", color: "#4b5563", marginBottom: "24px", lineHeight: "1.5" }}>
              Please tell us correct reason for cancellation. This information is only used to improve our service
            </p>
            
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#4b5563", marginBottom: "16px" }}>
              Select Reason<span style={{ color: "#ef4444" }}>*</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              {["Incorrect size ordered", "Product not required anymore", "Cash Issue", "Ordered By Mistake", "Wants to change style/color", "Delayed Delivery Cancellation", "Duplicate Order"].map(reason => (
                <label key={reason} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                  <input type="radio" name="cancelReason" value={reason} checked={cancelReason === reason} onChange={(e) => setCancelReason(e.target.value)} style={{ width: "20px", height: "20px", accentColor: "#1f2937" }} />
                  <span style={{ fontSize: "14px", color: "#374151" }}>{reason}</span>
                </label>
              ))}
            </div>

            <textarea 
              placeholder="Additional Comments"
              value={cancelComments}
              onChange={(e) => setCancelComments(e.target.value)}
              style={{ width: "100%", padding: "16px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", minHeight: "100px", resize: "none", marginBottom: "32px", fontFamily: "inherit" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e5e7eb", paddingTop: "24px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>REFUND DETAILS</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937" }}>
                  ₹ {cancellingOrder.paymentMethod === "COD" || cancellingOrder.paymentMethod === "Cash on Delivery" ? 0 : cancellingOrder.total.toFixed(2)}
                </div>
              </div>
              <button 
                onClick={handleCancelSubmit}
                disabled={!cancelReason}
                style={{ 
                  backgroundColor: cancelReason ? "#fb3974" : "#fca5a5", 
                  color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 700, fontSize: "14px", cursor: cancelReason ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", gap: "8px"
                }}
              >
                CANCEL <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {reviewingItem && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "white", zIndex: 1000, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "16px", borderBottom: "1px solid #e5e7eb", backgroundColor: "white", position: "sticky", top: 0, zIndex: 10 }}>
            <button onClick={() => setReviewingItem(null)} style={{ background: "none", border: "none", padding: "4px", cursor: "pointer" }}>
              <X size={24} color="#374151" />
            </button>
            <h2 style={{ flex: 1, textAlign: "center", fontSize: "16px", fontWeight: 700, margin: 0, color: "#1f2937", textTransform: "uppercase", letterSpacing: "1px", marginRight: "32px" }}>
              Write Review
            </h2>
          </div>
          
          <div style={{ backgroundColor: "#ffeff1", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: "#fff", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              💰
            </div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#1f2937" }}>
              Write review and earn upto ₹2000 Myntra Credit.
            </div>
          </div>

          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
              <div style={{ width: "80px", height: "100px", backgroundColor: "#f3f4f6", borderRadius: "8px", backgroundImage: `url(${reviewingItem.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", color: "#4b5563", marginBottom: "8px", lineHeight: "1.4" }}>
                  {reviewingItem.name}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setReviewRating(star)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                      <Star size={24} fill={reviewRating >= star ? "#ff3f6c" : "#e5e7eb"} color={reviewRating >= star ? "#ff3f6c" : "#e5e7eb"} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: "#fff5f6", border: "1px dashed #ffb3c6", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: reviewImages.length > 0 ? "16px" : "0" }}>
                <div style={{ flex: 1, paddingRight: "16px" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#ff3f6c", marginBottom: "4px" }}>ADD PHOTOS</div>
                  <div style={{ fontSize: "13px", color: "#4b5563", marginBottom: "8px", lineHeight: "1.4" }}>
                    Stand a chance to get featured with the product and become an inspiration for millions of customers.
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    <strong>Tips:</strong> Upload photos using / wearing the product
                  </div>
                </div>
                <div style={{ position: "relative" }}>
                  <button disabled={isUploading} style={{ width: "50px", height: "50px", border: "1px solid #ff3f6c", borderRadius: "4px", backgroundColor: "white", display: "flex", justifyContent: "center", alignItems: "center", color: "#ff3f6c", cursor: isUploading ? "not-allowed" : "pointer", opacity: isUploading ? 0.7 : 1 }}>
                    <Camera size={24} />
                  </button>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} style={{ position: "absolute", inset: 0, opacity: 0, cursor: isUploading ? "not-allowed" : "pointer" }} />
                </div>
              </div>
              {/* Display uploaded images */}
              {reviewImages.length > 0 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {reviewImages.map((img, idx) => (
                    <div key={idx} style={{ width: "64px", height: "64px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                      <img src={img} alt="Review upload" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                  {isUploading && (
                    <div style={{ width: "64px", height: "64px", borderRadius: "8px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" }}>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ fontWeight: 700, fontSize: "16px", color: "#1f2937", marginBottom: "12px" }}>
              Write your review here
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Please write product review here."
              style={{ width: "100%", height: "200px", padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", resize: "none", marginBottom: "16px" }}
            />

            <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.5", marginBottom: "16px" }}>
              By submitting review you give us consent to publish and process personal information in accordance with <span style={{ color: "#ff3f6c", fontWeight: 700 }}>Terms of use</span> and <span style={{ color: "#ff3f6c", fontWeight: 700 }}>Privacy Policy</span>
            </div>

            <button
              onClick={handleReviewSubmit}
              disabled={reviewRating === 0 || !reviewComment}
              style={{ width: "100%", padding: "16px", backgroundColor: (reviewRating === 0 || !reviewComment) ? "#f3f4f6" : "white", border: `1px solid ${(reviewRating === 0 || !reviewComment) ? "#e5e7eb" : "#ff3f6c"}`, borderRadius: "4px", fontWeight: 700, fontSize: "14px", color: (reviewRating === 0 || !reviewComment) ? "#9ca3af" : "#ff3f6c", cursor: (reviewRating === 0 || !reviewComment) ? "not-allowed" : "pointer", letterSpacing: "1px" }}
            >
              SUBMIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
