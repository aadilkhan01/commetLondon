"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Info, X } from "lucide-react";
import Link from "next/link";
import { useAuthStore, useCartStore, useAddressStore } from "@/store";
import api from "@/lib/api";

export default function PaymentClient() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { addresses, addressesLoaded, fetchAddresses } = useAddressStore();
  
  const [mounted, setMounted] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [expandedOption, setExpandedOption] = useState<string | null>("Credit/Debit Card");
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [saveCard, setSaveCard] = useState(true);
  
  const [netBankingBank, setNetBankingBank] = useState("");
  
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiMethod, setUpiMethod] = useState("");
  const [showOtherBanksModal, setShowOtherBanksModal] = useState(false);
  const [allBanks, setAllBanks] = useState<{id: string, name: string}[]>([]);
  
  const [detectedBank, setDetectedBank] = useState("Credit/Debit Card");
  const [detectedBrand, setDetectedBrand] = useState("");

  useEffect(() => { 
    setMounted(true); 
    if (isAuthenticated) {
      // Fetch saved cards
      api.get("/api/v1/users/cards").then(res => {
        if (res.data?.success) {
          setSavedCards(res.data.data || []);
        }
      }).catch(err => console.error("Failed to load cards", err));

      // Fetch all banks
      api.get("/api/v1/users/banks").then(res => {
        if (res.data?.success) {
          setAllBanks(res.data.data || []);
        }
      }).catch(err => console.error("Failed to load banks", err));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    if (cleanNumber.length >= 6) {
      const bin = cleanNumber.substring(0, 6); // Look up first 6 digits
      api.get(`/api/v1/users/bin/${bin}`)
        .then(res => {
          if (res.data?.success) {
            if (res.data.bank?.name) {
              setDetectedBank(res.data.bank.name);
            }
            if (res.data.scheme) {
              setDetectedBrand(res.data.scheme.toUpperCase());
            }
          } else {
            throw new Error("BIN not found");
          }
        })
        .catch(() => {
          // fallback if not found in db
          setDetectedBank("Credit/Debit Card");
          let mockBrand = "CARD";
          if (cleanNumber.startsWith("4")) { mockBrand = "VISA"; }
          else if (cleanNumber.startsWith("5")) { mockBrand = "MASTERCARD"; }
          else if (cleanNumber.startsWith("6")) { mockBrand = "RUPAY"; }
          setDetectedBrand(mockBrand);
        });
    } else {
      setDetectedBank("Credit/Debit Card");
      setDetectedBrand("");
    }
  }, [cardNumber]);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login?redirect=/checkout/payment");
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

  const subtotal = getSubtotal();
  const shipping = subtotal >= 100 ? 0 : 9.99;
  const platformFee = 23;
  const codFee = (paymentMethod === "COD" || paymentMethod === "RECOMMENDED_COD") ? 10 : 0;
  const total = subtotal + shipping + platformFee + codFee;

  const selectedItems = items.filter((i) => i.selected !== false);

  const handlePlaceOrder = async (e?: React.FormEvent, forceMethod?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    let usedMethod = forceMethod || paymentMethod;
    if (forceMethod === "NEW_CARD") {
      usedMethod = "CREDIT_CARD";
      if (saveCard && cardNumber.length >= 12) {
        const newCard = {
          id: "CARD-" + Date.now(),
          brand: detectedBrand || (cardNumber.startsWith("4") ? "VISA" : cardNumber.startsWith("5") ? "MASTERCARD" : "CARD"),
          last4: cardNumber.slice(-4),
          bank: detectedBank
        };
        const updatedCards = [...savedCards, newCard];
        setSavedCards(updatedCards);
        api.post("/api/v1/users/cards", newCard).catch(err => console.error("Failed to save card to db", err));
      }
    } else if (forceMethod === "NET_BANKING") {
      usedMethod = netBankingBank;
    }

    const addressToUse = addresses.find(a => a.id === selectedAddressId) || addresses[0];

    const payload = {
      items: selectedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: total,
      shippingAddress: addressToUse ? {
        fullName: addressToUse.fullName,
        phone: addressToUse.phone,
        addressLine1: addressToUse.addressLine1,
        city: addressToUse.city,
        state: addressToUse.state,
        zipCode: addressToUse.zipCode,
        country: addressToUse.country || "India"
      } : {
        fullName: "Guest", phone: "000", addressLine1: "123 Main", city: "City", state: "State", zipCode: "12345", country: "India"
      },
      paymentMethod: usedMethod,
    };

    let orderId = "ORD-" + Math.floor(Math.random() * 1000000);
    try {
      const response = await api.post("/api/v1/orders", payload);
      if (response.data.success) {
        orderId = response.data.data.id;
      }
    } catch (err: any) {
      console.warn("Order API failed, proceeding with mock order ID", err);
    }
    
    sessionStorage.setItem("lastOrderAddress", JSON.stringify(payload.shippingAddress));
    sessionStorage.setItem("lastOrderItems", JSON.stringify(selectedItems));
    
    const estimateDate = new Date();
    estimateDate.setDate(estimateDate.getDate() + 5);
    const estimateStr = estimateDate.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
    sessionStorage.setItem("lastOrderEstimate", estimateStr);
    sessionStorage.setItem("lastOrderId", orderId);

    clearCart();
    router.push(`/order-confirmation/${orderId}`);
  };

  const toggleOption = (opt: string) => {
    if (expandedOption !== opt) {
      setPaymentMethod("");
    }
    setExpandedOption(expandedOption === opt ? null : opt);
  };


  return (
    
    <div style={{ backgroundColor: "#f5f5f6", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ backgroundColor: "var(--color-bg-white)", borderBottom: "1px solid var(--color-border-light)", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container-main" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "78px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 20px 10px" }}>
            <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>
              PAYMENT
            </h1>
          </div>

          <div className="hidden md:flex" style={{ alignItems: "center", gap: "12px", fontFamily: "var(--font-heading)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em" }}>
            <Link href="/cart" style={{ color: "var(--color-text-primary)", textDecoration: "none" }}>BAG</Link>
            <span style={{ color: "var(--color-border)", letterSpacing: "2px" }}>--------</span>
            <Link href="/checkout/address" style={{ color: "var(--color-text-primary)", textDecoration: "none" }}>ADDRESS</Link>
            <span style={{ color: "var(--color-border)", letterSpacing: "2px" }}>--------</span>
            <span style={{ color: "var(--color-accent-green)", borderBottom: "2px solid var(--color-accent-green)", paddingBottom: "4px" }}>PAYMENT</span>
          </div>
        </div>
      </div>

      <div className="container-main container-submain" style={{ paddingTop: "20px", paddingBottom: "150px" }}>
        <div style={{ display: "flex", gap: "32px", width: "100%" }} className="flex-col lg:flex-row">
          
          {/* Left Column: Payment Options */}
          <div style={{ flex: "1 1 65%" }}>
            
            <div style={{ backgroundColor: "#f5f5f6", padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.05em" }}>
              RECOMMENDED PAYMENT OPTIONS
            </div>

            <div style={{ backgroundColor: "var(--color-bg-white)", border: "1px solid var(--color-border-light)" }}>
              
              {/* Cash on Delivery (Recommended) */}
              <div style={{ padding: "20px 16px", borderBottom: "1px dashed var(--color-border-light)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <input type="radio" checked={paymentMethod === "RECOMMENDED_COD"} onChange={() => { setPaymentMethod("RECOMMENDED_COD"); setExpandedOption(null); }} style={{ marginTop: "4px", accentColor: "var(--color-bg-dark)", width: "16px", height: "16px", cursor: "pointer" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>Cash on Delivery (Cash/UPI)</span>
                      <div style={{ padding: "4px", border: "1px solid var(--color-border)", borderRadius: "4px" }}>💵</div>
                    </div>
                    {paymentMethod === "RECOMMENDED_COD" && (
                      <div style={{ marginTop: "16px" }}>
                        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: "20px" }}>
                          For this option, there is a fee of ₹ 10. You can Pay online to avoid this.
                        </p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handlePlaceOrder(undefined, "COD"); }} 
                          disabled={loading}
                          style={{ width: "100%", padding: "14px", backgroundColor: "var(--color-bg-dark)", color: "white", borderRadius: "4px", fontWeight: 700, fontSize: "15px", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                        >
                          {loading ? "Processing..." : "Place order"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Saved Cards */}
              {savedCards.map((card) => (
                <div key={card.id} style={{ padding: "20px 16px", borderBottom: "1px dashed var(--color-border-light)", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <input type="radio" checked={paymentMethod === card.id} onChange={() => { setPaymentMethod(card.id); setExpandedOption(null); }} style={{ marginTop: "4px", accentColor: "var(--color-bg-dark)", width: "16px", height: "16px", cursor: "pointer" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>{card.bank}</div>
                        <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>**** {card.last4}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: "#1a1f71", fontStyle: "italic", fontSize: "16px" }}>{card.brand}</div>
                    </div>
                    {paymentMethod === card.id && (
                      <div style={{ marginTop: "16px" }}>
                        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                          <input type="password" placeholder="CVV" maxLength={3} style={{ width: "80px", padding: "12px", border: "1px solid var(--color-border)", borderRadius: "4px", fontSize: "14px" }} />
                        </div>
                        <button 
                          onClick={() => handlePlaceOrder(undefined, card.id)} 
                          disabled={loading}
                          style={{ width: "100%", padding: "14px", backgroundColor:  "var(--color-bg-dark)", color: "white", borderRadius: "4px", fontWeight: 700, fontSize: "14px", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                        >
                          {loading ? "Processing..." : "Pay Now"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* PhonePe */}
              <div style={{ padding: "20px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <input type="radio" checked={paymentMethod === "PHONEPE"} onChange={() => { setPaymentMethod("PHONEPE"); setExpandedOption(null); }} style={{ marginTop: "4px", accentColor: "var(--color-bg-dark)", width: "18px", height: "18px", cursor: "pointer" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>PhonePe</div>
                      <div style={{ width: "28px", height: "28px", backgroundColor: "#5f259f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "14px" }}>पे</div>
                    </div>
                    {paymentMethod === "PHONEPE" && (
                      <button 
                        onClick={() => setShowUpiModal(true)} 
                        disabled={loading}
                        style={{ width: "100%", padding: "14px", backgroundColor: "var(--color-bg-dark)", color: "white", borderRadius: "4px", fontWeight: 700, fontSize: "14px", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "16px" }}
                      >
                        {loading ? "Processing..." : "Pay Now"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
            </div>

            <div style={{ backgroundColor: "#f5f5f6", padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.05em", marginTop: "16px" }}>
              ONLINE PAYMENT OPTIONS
            </div>

            <div style={{ backgroundColor: "var(--color-bg-white)", border: "1px solid var(--color-border-light)", borderBottom: "none" }}>
              
              {/* UPI */}
              <div style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                <div onClick={() => toggleOption("UPI")} style={{ padding: "20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "16px", fontStyle: "italic", fontWeight: 800, color: "#666" }}>UPI</div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>UPI (Pay via any App)</div>
                  </div>
                  {expandedOption === "UPI" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {expandedOption === "UPI" && (
                  <div style={{ padding: "0 16px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", cursor: "pointer" }} onClick={() => setUpiMethod("PHONEPE")}>
                      <input type="radio" checked={upiMethod === "PHONEPE"} onChange={() => setUpiMethod("PHONEPE")} style={{ accentColor:  "var(--color-bg-dark)", width: "18px", height: "18px" }} />
                      <div style={{ width: "40px", height: "40px", backgroundColor: "#5f259f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "20px" }}>पे</div>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>PhonePe</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", cursor: "pointer" }} onClick={() => setUpiMethod("PAYTM")}>
                      <input type="radio" checked={upiMethod === "PAYTM"} onChange={() => setUpiMethod("PAYTM")} style={{ accentColor:  "var(--color-bg-dark)", width: "18px", height: "18px" }} />
                      <div style={{ width: "40px", height: "40px", backgroundColor: "#00b9f1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "14px", fontStyle: "italic" }}>Paytm</div>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>Paytm</span>
                    </div>
                    
                    {upiMethod && (
                      <button 
                        onClick={() => setShowUpiModal(true)} 
                        style={{ width: "100%", padding: "14px", backgroundColor:  "var(--color-bg-dark)", color: "white", borderRadius: "4px", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer" }}
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Credit/Debit Card */}
              <div style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                <div onClick={() => toggleOption("Credit/Debit Card")} style={{ padding: "20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "18px" }}>💳</div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>
                      Credit/Debit Card 
                    </div>
                  </div>
                  {expandedOption === "Credit/Debit Card" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {expandedOption === "Credit/Debit Card" && (
                  <div style={{ padding: "0 16px 24px" }}>
                    <p style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "16px" }}>
                      Please Ensure your card can be used for online transactions. <span style={{ color: "#ff3f6c", fontWeight: 700, cursor: "pointer" }}>Know More</span>
                    </p>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ position: "relative" }}>
                        <input 
                          type="text" 
                          placeholder="Card Number" 
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          autoComplete="cc-number"
                          style={{ width: "100%", padding: "14px", border: "1px solid var(--color-border)", borderRadius: "4px", fontSize: "14px" }} 
                        />
                        <div style={{ position: "absolute", right: "12px", top: "10px", display: "flex", alignItems: "center", gap: "8px", pointerEvents: "none" }}>
                          {detectedBank !== "Credit/Debit Card" && (
                            (() => {
                              const name = detectedBank.toUpperCase();
                              let logoUrl = null;
                              if (name.includes("HDFC")) logoUrl = "https://1000logos.net/wp-content/uploads/2021/06/HDFC-Bank-logo.png";
                              else if (name.includes("STATE BANK") || name.includes("SBI")) logoUrl = "https://1000logos.net/wp-content/uploads/2021/06/State-Bank-of-India-logo.png";
                              else if (name.includes("ICICI")) logoUrl = "https://1000logos.net/wp-content/uploads/2021/06/ICICI-Bank-logo.png";
                              else if (name.includes("AXIS")) logoUrl = "https://1000logos.net/wp-content/uploads/2021/06/Axis-Bank-logo.png";
                              else if (name.includes("KOTAK")) logoUrl = "https://1000logos.net/wp-content/uploads/2021/06/Kotak-Mahindra-Bank-logo.png";
                              
                              return logoUrl ? (
                                <img src={logoUrl} alt={detectedBank} style={{ height: "18px", objectFit: "contain" }} />
                              ) : (
                                <span style={{ color: "#666", fontSize: "11px", fontWeight: 600 }}>{detectedBank}</span>
                              );
                            })()
                          )}
                          <span style={{ color: "#1a1f71", fontSize: "16px", fontWeight: 700, fontStyle: "italic" }}>{detectedBrand || "💳"}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", gap: "16px" }}>
                        <input 
                          type="text" 
                          placeholder="Valid Thru (MM/YY)" 
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          autoComplete="cc-exp"
                          style={{ flex: 1, padding: "14px", border: "1px solid var(--color-border)", borderRadius: "4px", fontSize: "14px" }} 
                        />
                        <div style={{ flex: 1, position: "relative" }}>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            placeholder="CVV" 
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            autoComplete="cc-csc"
                            style={{ WebkitTextSecurity: "disc", width: "100%", padding: "14px", border: "1px solid var(--color-border)", borderRadius: "4px", fontSize: "14px" }} 
                          />
                          <Info size={16} color="var(--color-text-muted)" style={{ position: "absolute", right: "12px", top: "16px" }} />
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", marginBottom: "8px" }}>
                        <input 
                          type="checkbox" 
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          style={{ accentColor:  "var(--color-bg-dark)", width: "16px", height: "16px", cursor: "pointer" }} 
                        />
                        <label style={{ fontSize: "13px", color: "var(--color-text-secondary)", cursor: "pointer" }} onClick={() => setSaveCard(!saveCard)}>
                          Save this card for faster payments
                        </label>
                      </div>

                      <button 
                        onClick={(e) => handlePlaceOrder(e, "NEW_CARD")} 
                        disabled={loading || !cardNumber}
                        style={{ width: "100%", padding: "14px", backgroundColor:  "var(--color-bg-dark)", color: "white", borderRadius: "4px", fontWeight: 700, fontSize: "14px", border: "none", cursor: loading || !cardNumber ? "not-allowed" : "pointer", opacity: loading || !cardNumber ? 0.7 : 1 }}
                      >
                        {loading ? "Processing..." : "Pay Now"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Net Banking */}
              <div style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                <div onClick={() => toggleOption("Net Banking")} style={{ padding: "20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "18px" }}>🏦</div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>Net Banking</div>
                  </div>
                  {expandedOption === "Net Banking" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {expandedOption === "Net Banking" && (
                  <div style={{ padding: "0 16px 24px" }}>
                    {allBanks.slice(0, 5).map((bank) => (
                      <div key={bank.id} style={{ padding: "16px 0", borderBottom: "1px dashed var(--color-border-light)", display: "flex", alignItems: "center", gap: "12px" }}>
                        <input type="radio" checked={netBankingBank === bank.name} onChange={() => setNetBankingBank(bank.name)} style={{ accentColor: "var(--color-bg-dark)", width: "16px", height: "16px", cursor: "pointer" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "32px", height: "32px", backgroundColor: "#f5f5f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🏦</div>
                          <span style={{ fontSize: "14px", color: "var(--color-text-primary)" }}>{bank.name}</span>
                        </div>
                      </div>
                    ))}
                    
                    <div 
                      onClick={() => setShowOtherBanksModal(true)} 
                      style={{ marginTop: "16px", padding: "14px", border: "1px solid var(--color-border)", borderRadius: "4px", fontSize: "14px", backgroundColor: "white", color: "var(--color-text-primary)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    >
                      <span style={{ color: allBanks.slice(0, 5).some(b => b.name === netBankingBank) || !netBankingBank ? "inherit" : "var(--color-text-primary)", fontWeight: !allBanks.slice(0, 5).some(b => b.name === netBankingBank) && netBankingBank ? 600 : 400 }}>
                        {!allBanks.slice(0, 5).some(b => b.name === netBankingBank) && netBankingBank ? netBankingBank : "Other Banks"}
                      </span>
                      <ChevronDown size={16} color="var(--color-text-secondary)" />
                    </div>

                    {netBankingBank && (
                      <button 
                        onClick={(e) => handlePlaceOrder(e, "NET_BANKING")} 
                        disabled={loading}
                        style={{ width: "100%", padding: "14px", backgroundColor:  "var(--color-bg-dark)", color: "white", borderRadius: "4px", fontWeight: 700, fontSize: "14px", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "24px" }}
                      >
                        {loading ? "Processing..." : "Pay Now"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: "#f5f5f6", padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.05em", marginTop: "16px" }}>
              PAY ON DELIVERY OPTION
            </div>
            
            <div style={{ backgroundColor: "var(--color-bg-white)", border: "1px solid var(--color-border-light)" }}>
              <div onClick={() => { setPaymentMethod("COD"); setExpandedOption(null); }} style={{ padding: "20px 16px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <input type="radio" checked={paymentMethod === "COD"} onChange={() => { setPaymentMethod("COD"); setExpandedOption(null); }} style={{ marginTop: "4px", accentColor: "var(--color-bg-dark)", width: "18px", height: "18px", cursor: "pointer" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--color-text-primary)" }}>Cash on Delivery (Cash/UPI)</span>
                      <div style={{ padding: "2px 6px", border: "1.5px solid #000", borderRadius: "4px", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        ₹
                      </div>
                    </div>
                    {paymentMethod === "COD" && (
                      <div style={{ marginTop: "16px" }}>
                        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: "20px" }}>
                          For this option, there is a fee of ₹ 10. You can Pay online to avoid this.
                        </p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handlePlaceOrder(undefined, "COD"); }} 
                          disabled={loading}
                          style={{ width: "100%", padding: "14px", backgroundColor: "var(--color-bg-dark)", color: "white", borderRadius: "4px", fontWeight: 700, fontSize: "15px", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                        >
                          {loading ? "Processing..." : "Place order"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: "var(--color-bg-white)", border: "1px solid var(--color-border-light)", marginTop: "16px", padding: "20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ fontSize: "20px" }}>🎁</div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>Have a Gift Card?</div>
              </div>
              <div style={{ color:  "var(--color-bg-dark)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>APPLY</div>
            </div>

          </div>

          {/* Right Column: Price Details (Desktop) */}
          <div className="hidden lg:block" style={{ flex: "1 1 35%" }}>
            <div style={{ padding: "24px", backgroundColor: "var(--color-bg-white)", borderRadius: "12px", border: "1px solid var(--color-border-light)", marginBottom: "40px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "20px", fontFamily: "var(--font-body)", letterSpacing: "normal" }}>
                Price Details ({selectedItems.length} item{selectedItems.length !== 1 && 's'})
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px", color: "var(--color-text-primary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total MRP</span>
                  <span>₹{(subtotal * 1.2).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Discount on MRP</span>
                  <span style={{ color: "var(--color-accent-green)" }}>- ₹{(subtotal * 0.2).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Platform Fee</span>
                  <span>₹{platformFee.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Shipping Fee</span>
                  <span>{shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}</span>
                </div>
                {codFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Cash/Pay on Delivery Fee</span>
                    <span>₹{codFee.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "20px", borderTop: "1px dashed var(--color-border)", fontSize: "16px", fontWeight: 700 }}>
                <span>Total Amount</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "16px" }}>
              By placing the order, you agree to GoCarry's <span style={{ color: "#ff3f6c", fontWeight: 700 }}>Terms of Use</span>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Sticky Bottom Bar (Price Details Accordion) */}
      <div 
        className="flex flex-col lg:hidden" 
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "var(--color-bg-white)",
          borderTop: "1px solid var(--color-border-light)",
          zIndex: 100,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.05)"
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", padding: "12px 16px 0", textAlign: "center" }}>
          By placing the order, you agree to GoCarry's <span style={{ color: "#ff3f6c", fontWeight: 700 }}>Terms of Use</span>
        </div>
        
        {showPriceDetails && (
          <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border-light)", backgroundColor: "#fcfcfc" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "16px" }}>
              Price Details ({selectedItems.length} item{selectedItems.length !== 1 && 's'})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "var(--color-text-primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Total MRP</span>
                <span>₹{(subtotal * 1.2).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Discount on MRP</span>
                <span style={{ color: "var(--color-accent-green)" }}>- ₹{(subtotal * 0.2).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Platform Fee</span>
                <span>₹{platformFee.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Shipping Fee</span>
                <span>{shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}</span>
              </div>
              {codFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Cash/Pay on Delivery Fee</span>
                  <span>₹{codFee.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div style={{ padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div onClick={() => setShowPriceDetails(!showPriceDetails)} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <span style={{ fontWeight: 700, fontSize: "14px" }}>Price Details ({selectedItems.length} item{selectedItems.length !== 1 && 's'})</span>
            {showPriceDetails ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "var(--color-text-muted)", fontSize: "12px", fontWeight: 600 }}>Total Amount:</span>
            <span style={{ fontSize: "16px", fontWeight: 700 }}>₹{total.toFixed(2)}</span>
          </div>
        </div>
        </div>

      {showUpiModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", width: "90%", maxWidth: "400px", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "var(--color-text-primary)" }}>Scan & Pay ₹{total.toFixed(2)}</h3>
            <div style={{ width: "220px", height: "220px", backgroundColor: "#f5f5f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", border: "1px dashed #ccc", borderRadius: "8px" }}>
              <div style={{ textAlign: "center", color: "var(--color-text-secondary)" }}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>📱</div>
                <div style={{ fontWeight: 600 }}>Simulated QR Code</div>
              </div>
            </div>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", textAlign: "center", marginBottom: "24px", lineHeight: 1.5 }}>
              Scan this QR code with any UPI app to complete your payment securely.
            </p>
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <button 
                onClick={() => setShowUpiModal(false)}
                style={{ flex: 1, padding: "12px", backgroundColor: "#f5f5f6", color: "var(--color-text-primary)", borderRadius: "4px", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                onClick={(e) => {
                  setShowUpiModal(false);
                  handlePlaceOrder(e as any, "UPI");
                }}
                disabled={loading}
                style={{ flex: 1, padding: "12px", backgroundColor: "#03a685", color: "white", borderRadius: "4px", fontWeight: 700, fontSize: "14px", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Processing..." : "Simulate Success"}
              </button>
            </div>
          </div>
          </div>
      )}

      {showOtherBanksModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ backgroundColor: "white", borderTopLeftRadius: "16px", borderTopRightRadius: "16px", width: "100%", maxWidth: "500px", height: "80vh", maxHeight: "600px", display: "flex", flexDirection: "column", boxShadow: "0 -10px 30px rgba(0,0,0,0.15)", overflow: "hidden", animation: "slideUp 0.3s ease-out" }}>
            <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border-light)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Select Bank</h3>
              <div onClick={() => setShowOtherBanksModal(false)} style={{ cursor: "pointer", color: "var(--color-text-secondary)" }}>
                <X size={24} />
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto" }}>
              {allBanks.slice(5).map((bank) => (
                <div 
                  key={bank.id} 
                  onClick={() => {
                    setNetBankingBank(bank.name);
                    setShowOtherBanksModal(false);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#f5f5f6", border: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                    🏛️
                  </div>
                  <span style={{ fontSize: "14px", color: "var(--color-text-primary)" }}>{bank.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
