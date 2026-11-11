"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore, useCartStore, useAddressStore } from "@/store";

export default function AddressClient() {
  const router = useRouter();
  const { items } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { addresses, addressesLoaded, fetchAddresses } = useAddressStore();
  const [mounted, setMounted] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showSelectAddress, setShowSelectAddress] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login?redirect=/checkout/address");
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (mounted && isAuthenticated && !addressesLoaded) {
      fetchAddresses();
    }
  }, [mounted, isAuthenticated, addressesLoaded, fetchAddresses]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault);
      setSelectedAddressId(defaultAddr?.id || addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  if (!mounted || !isAuthenticated) return null;

  const selectedItems = items.filter((i) => i.selected !== false);
  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];

  const handleContinue = () => {
    if (!selectedAddressId && addresses.length > 0) {
      alert("Please select a delivery address");
      return;
    }
    router.push("/checkout/payment");
  };

  // 5 days from now for estimate
  const estimateDate = new Date();
  estimateDate.setDate(estimateDate.getDate() + 5);
  const estimateStr = estimateDate.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ backgroundColor: "#f5f5f6", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ backgroundColor: "var(--color-bg-white)", borderBottom: "1px solid var(--color-border-light)", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container-main" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "78px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 20px 10px" }}>
            <button onClick={() => { showSelectAddress ? setShowSelectAddress(false) : router.back() }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>
              {showSelectAddress ? "SELECT ADDRESS" : "ADDRESS"}
            </h1>
          </div>

          <div className="hidden md:flex" style={{ alignItems: "center", gap: "12px", fontFamily: "var(--font-heading)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em" }}>
            <Link href="/cart" style={{ color: "var(--color-text-primary)", textDecoration: "none" }}>BAG</Link>
            <span style={{ color: "var(--color-border)", letterSpacing: "2px" }}>--------</span>
            <span style={{ color: "var(--color-accent-green)", borderBottom: "2px solid var(--color-accent-green)", paddingBottom: "4px" }}>ADDRESS</span>
            <span style={{ color: "var(--color-border)", letterSpacing: "2px" }}>--------</span>
            <span style={{ color: "var(--color-text-muted)" }}>PAYMENT</span>
          </div>

          <div className="md:hidden" style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.1em", paddingRight: "20px" }}>
            STEP 2/3
          </div>
        </div>
      </div>

      <div className="container-main container-submain" style={{ paddingTop: "20px", paddingBottom: "100px", maxWidth: "600px", margin: "0 auto" }}>
        {showSelectAddress ? (
          /* --- SELECT ADDRESS VIEW --- */
          <div style={{ backgroundColor: "var(--color-bg-white)", border: "1px solid var(--color-border-light)" }}>
            <div style={{ padding: "16px" }}>
              <button 
                onClick={() => router.push("/profile/addresses?redirect=/checkout/address")}
                style={{ width: "100%", padding: "14px", backgroundColor: "var(--color-bg-white)", border: "1px solid var(--color-bg-dark)", color: "var(--color-bg-dark)", fontWeight: 700, fontSize: "13px", letterSpacing: "0.05em", fontFamily: "var(--font-heading)", cursor: "pointer" }}
              >
                ADD NEW ADDRESS
              </button>
            </div>
            
            <div style={{ backgroundColor: "#f5f5f6", padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.05em" }}>
              SAVED ADDRESSES
            </div>

            {addresses.map(addr => (
              <div key={addr.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "20px 16px", borderBottom: "1px solid var(--color-border-light)", cursor: "pointer" }} onClick={() => setSelectedAddressId(addr.id)}>
                <input 
                  type="radio" 
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  style={{ marginTop: "4px", accentColor: "var(--color-bg-dark)", width: "16px", height: "16px" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>{addr.fullName}</span>
                    <span style={{ fontSize: "10px", padding: "2px 8px", border: "1px solid var(--color-accent-green)", color: "var(--color-accent-green)", borderRadius: "12px", fontWeight: 600 }}>{addr.addressLine2 ? "HOME" : "OFFICE"}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: "8px" }}>
                    {addr.addressLine1} {addr.addressLine2 && `, ${addr.addressLine2}`}<br />
                    {addr.city}, {addr.state} {addr.zipCode}
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    Mobile: <strong style={{ color: "var(--color-text-primary)" }}>{addr.phone}</strong>
                  </p>
                  
                  {selectedAddressId === addr.id && (
                    <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                      <button style={{ flex: 1, padding: "10px", backgroundColor: "var(--color-bg-white)", border: "1px solid var(--color-border-dark)", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>REMOVE</button>
                      <button style={{ flex: 1, padding: "10px", backgroundColor: "var(--color-bg-white)", border: "1px solid var(--color-border-dark)", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>EDIT</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "var(--color-bg-white)", padding: "12px 16px", borderTop: "1px solid var(--color-border-light)", zIndex: 100 }}>
              <button 
                onClick={() => setShowSelectAddress(false)}
                className="btn-primary" 
                style={{ width: "100%", padding: "14px", backgroundColor: "var(--color-bg-dark)", color: "white", borderRadius: "4px", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer" }}
              >
                CONFIRM
              </button>
            </div>
          </div>
        ) : (
          /* --- MAIN ADDRESS VIEW --- */
          <div style={{ backgroundColor: "var(--color-bg-white)", border: "1px solid var(--color-border-light)" }}>
            {selectedAddress ? (
              <div style={{ padding: "20px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--color-text-primary)" }}>{selectedAddress.fullName}</span>
                    <span style={{ fontSize: "10px", padding: "2px 8px", border: "1px solid var(--color-accent-green)", color: "var(--color-accent-green)", borderRadius: "12px", fontWeight: 600 }}>HOME</span>
                  </div>
                  <button onClick={() => setShowSelectAddress(true)} style={{ background: "none", border: "none", color: "var(--color-bg-dark)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                    Change
                  </button>
                </div>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: "8px" }}>
                  {selectedAddress.addressLine1} {selectedAddress.addressLine2 && `, ${selectedAddress.addressLine2}`}<br />
                  {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                </p>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  Mobile: <strong style={{ color: "var(--color-text-primary)" }}>{selectedAddress.phone}</strong>
                </p>
              </div>
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>No delivery address found.</p>
                <button 
                  onClick={() => router.push("/profile/addresses?redirect=/checkout/address")}
                  className="btn-primary" 
                  style={{ padding: "12px 24px", backgroundColor: "var(--color-bg-dark)", color: "white", borderRadius: "4px", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer" }}
                >
                  ADD NEW ADDRESS
                </button>
              </div>
            )}

            <div style={{ backgroundColor: "#f5f5f6", padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.05em" }}>
              DELIVERY ESTIMATES
            </div>
            
          
                {selectedItems.map((item) => (
              <div style={{ padding: "16px",borderBottom:"solid grey 1px"}}>
                <div style={{ display: "flex", gap: "16px", overflowX: "auto" }}>
                  <div key={item.productId + (item.color || '')} style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "250px" }}>
                    <div style={{ width: "48px", height: "60px", flexShrink: 0, backgroundColor: "var(--color-bg-cream)", borderRadius: "4px", overflow: "hidden" }}>
                      {item.image && <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                    <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      Estimated delivery by <strong style={{ color: "var(--color-text-primary)" }}>{estimateStr}</strong>
                    </div>
                    </div>
                </div>
            </div>
            
                ))}
            

            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "var(--color-bg-white)", padding: "12px 16px", borderTop: "1px solid var(--color-border-light)", zIndex: 100 }}>
              <button 
                onClick={handleContinue}
                disabled={!selectedAddress}
                className="btn-primary" 
                style={{ width: "100%", padding: "14px", backgroundColor: selectedAddress ?  "var(--color-bg-dark)" : "var(--color-border)", color: "white", borderRadius: "4px", fontWeight: 700, fontSize: "14px", border: "none", cursor: selectedAddress ? "pointer" : "not-allowed" }}
              >
                CONTINUE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
