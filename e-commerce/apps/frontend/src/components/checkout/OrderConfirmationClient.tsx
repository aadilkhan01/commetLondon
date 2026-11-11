"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface OrderItem {
  id: string;
  product: {
    name: string;
    image: string;
    brand: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: OrderItem[];
  status: string;
}

export default function OrderConfirmationClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [estimate, setEstimate] = useState<string>("Tomorrow");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try to load from session storage (this is populated in PaymentClient)
    try {
      const storedAddress = sessionStorage.getItem("lastOrderAddress");
      const storedItems = sessionStorage.getItem("lastOrderItems");
      const storedEstimate = sessionStorage.getItem("lastOrderEstimate");
      
      if (storedAddress) setAddress(JSON.parse(storedAddress));
      if (storedItems) setItems(JSON.parse(storedItems));
      if (storedEstimate) setEstimate(storedEstimate);
    } catch (e) {
      console.error("Failed to parse session storage", e);
    }

    // 2. Try to fetch from API
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/api/v1/orders/${orderId}`);
        if (response.data && response.data.data) {
          setOrder(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch order", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;
  }

  // Prioritize dynamically passed session storage data over potentially static/dummy API responses
  const displayAddress = address || order?.shippingAddress || {
    fullName: "Guest",
    phone: "0000000000",
    addressLine1: "Address not found",
    city: "City",
    state: "State",
    zipCode: "00000"
  };

  const displayItems = items.length > 0 ? items : (order?.items || [
    {
      id: "1",
      name: "Product Not Found",
      brand: "UNKNOWN",
      image: "",
      quantity: 1,
      price: 0
    }
  ]);

  return (
    <div style={{ backgroundColor: "#fcfdfc", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      
      {/* Top Section with Light Green Background */}
      <div style={{ 
        background: "linear-gradient(180deg, #f0faf4 0%, #fcfdfc 100%)",
        padding: "40px 20px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        
        <div style={{ position: "relative", marginBottom: "16px" }}>
          {/* Badge Background */}
          <div style={{ 
            width: "80px", height: "80px", 
            backgroundColor: "#5bd395", 
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(91, 211, 149, 0.3)"
          }}>
            <div style={{ 
              width: "60px", height: "60px", 
              backgroundColor: "transparent",
              border: "3px solid white",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Check size={32} strokeWidth={4} color="white" />
            </div>
          </div>
        </div>

        <h1 style={{ color: "#37a66b", fontSize: "24px", fontWeight: 700, margin: "0 0 24px" }}>
          Order Placed
        </h1>

        {/* Delivery Address Card */}
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "12px", 
          padding: "16px", 
          width: "100%", 
          maxWidth: "500px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          border: "1px solid rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", color: "var(--color-text-primary)", fontSize: "13px", fontWeight: 600 }}>
            <MapPin size={16} />
            <span>Delivery Address</span>
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px", color: "var(--color-text-primary)" }}>
            {displayAddress.fullName} | {displayAddress.phone}
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            {displayAddress.addressLine1}, {displayAddress.city}, {displayAddress.state} {displayAddress.zipCode}
          </div>
        </div>
      </div>

      <div style={{ padding: "10px 20px 40px", maxWidth: "500px", margin: "0 auto" }}>
        
        {/* Order Summary Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px", padding: "0 4px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            Order Summary <span style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}>{displayItems.length} Item{displayItems.length !== 1 && 's'}</span>
          </div>
          <Link href="/orders" style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: "4px" }}>
            View All
          </Link>
        </div>

        {/* Order Item Card */}
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "12px", 
          padding: "16px", 
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          border: "1px solid rgba(0,0,0,0.03)",
          marginBottom: "40px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px dashed var(--color-border-light)", paddingBottom: "12px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
              <span style={{ color: "var(--color-bg-dark)", fontWeight: 700, fontStyle: "italic", fontSize: "12px" }}>EXPRESS+</span>
              <span style={{ color: "var(--color-border)" }}>|</span>
              <span>Delivery by <strong style={{ color: "var(--color-text-primary)" }}>{estimate}</strong></span>
            </div>
            <ChevronRight size={16} color="var(--color-text-muted)" />
          </div>

          {displayItems.map((item, idx) => (
            <div key={idx} style={{ display: "flex", gap: "16px", marginBottom: idx !== displayItems.length - 1 ? "16px" : 0 }}>
              <div style={{ width: "60px", height: "80px", flexShrink: 0, backgroundColor: "#f5f5f6", borderRadius: "8px", overflow: "hidden" }}>
                {(item.product?.image || item.image) && <img src={item.product?.image || item.image} alt={item.product?.name || item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                  {item.product?.brand || item.brand || "BRAND"}
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "8px", lineHeight: 1.3 }}>
                  {item.product?.name || item.name}
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", display: "flex", gap: "12px" }}>
                  <span>Size: {item.size || "9"}</span>
                  <span>Qty: {item.quantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping Section */}
        <div style={{ textAlign: "center", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", margin: "0 0 24px" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border-light)" }}></div>
            <div style={{ padding: "0 16px", fontSize: "16px", color: "var(--color-text-secondary)", fontWeight: 500 }}>
              Keep creating your wardrobe
            </div>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border-light)" }}></div>
          </div>
          
          <button 
            onClick={() => router.push("/shop")}
            style={{ 
              width: "100%", 
              padding: "16px", 
              backgroundColor: "white", 
              border: "1px solid #282c3f", 
              color: "#282c3f", 
              fontWeight: 700, 
              fontSize: "14px", 
              borderRadius: "4px",
              cursor: "pointer",
              letterSpacing: "0.05em",
              marginBottom: "40px"
            }}
          >
            CONTINUE SHOPPING
          </button>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", color: "#282c3f", fontWeight: 600, marginBottom: "8px" }}>
              Get the GoCarry mobile app
            </div>
            <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
              A faster and more convenient way to shop
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
