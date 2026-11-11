"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X, ArrowLeft } from "lucide-react";
import { useAuthStore, useAddressStore } from "@/store";
import api from "@/lib/api";

export default function AddressPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { addresses, fetchAddresses, addAddress, updateAddress, deleteAddress, isLoaded } = useAddressStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: "", phone: "", addressLine1: "", addressLine2: "",
    city: "", state: "", zipCode: "", country: "United States", isDefault: false,
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login?redirect=/profile/address");
      return;
    }
    if (isAuthenticated && !isLoaded) {
      fetchAddresses();
    }
  }, [isAuthenticated, mounted, router, fetchAddresses, isLoaded]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    let result = false;
    if (editingAddressId) {
      await updateAddress(editingAddressId, addressForm);
      result = true;
    } else {
      const res = await addAddress(addressForm);
      if (res) result = true;
    }
    setAddressLoading(false);
    if (result) {
      setShowAddressForm(false);
      setEditingAddressId(null);
    }
  };

  const handleEditAddress = (addr: any) => {
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipCode = e.target.value;
    setAddressForm(prev => ({ ...prev, zipCode }));

    if (zipCode.length === 6 && /^\d+$/.test(zipCode)) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${zipCode}`);
        const data = await response.json();
        if (data && data[0].Status === "Success") {
          const details = data[0].PostOffice[0];
          setAddressForm(prev => ({
            ...prev,
            city: details.District,
            state: details.State,
            country: details.Country || "India"
          }));
        }
      } catch (error) {
        console.error("Error fetching pincode details:", error);
      }
    }
  };

  const handleDeleteAddress = async (id: string) => {
    await deleteAddress(id);
  };

  if (!mounted || !isAuthenticated) return null;

  const inputStyle = {
    width: "100%", padding: "14px 16px", border: "1px solid var(--color-border)",
    fontSize: "14px", fontFamily: "var(--font-body)", outline: "none", backgroundColor: "transparent",
  };

  const labelStyle = {
    display: "block" as const, fontFamily: "var(--font-heading)", fontSize: "11px",
    letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: "8px",
  };

  const defaultAddress = addresses.find((a) => a.isDefault);
  const otherAddresses = addresses.filter((a) => !a.isDefault);

  const renderAddressCard = (addr: any) => (
    <div key={addr.id} style={{ padding: "20px 20px 0", backgroundColor: "white", position: "relative", borderBottom: "1px solid var(--color-border-light)", borderTop: "1px solid var(--color-border-light)", marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ minWidth: 0, flex: 1, paddingRight: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#333" }}>
              {addr.fullName}
            </h4>
            <span style={{ fontSize: "10px", fontWeight: 600, backgroundColor: "#f0f0f0", color: "#333", padding: "4px 8px", borderRadius: "12px", letterSpacing: "0.05em" }}>
              {addr.addressLine2?.toLowerCase().includes('office') || addr.addressLine1?.toLowerCase().includes('office') ? 'OFFICE' : 'HOME'}
            </span>
          </div>
          <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.6, marginBottom: "12px", width: "100%" }}>
            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
              {addr.addressLine1}
            </div>
            {addr.addressLine2 && (
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                {addr.addressLine2}
              </div>
            )}
            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
              {addr.city}, {addr.state} {addr.zipCode}
            </div>
            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
              {addr.country}
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "#666" }}>
            Mobile: {addr.phone}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0", borderTop: "1px solid var(--color-border-light)" }}>
        <button
          onClick={() => handleEditAddress(addr)}
          style={{
            flex: 1, padding: "16px 0", background: "none", border: "none", cursor: "pointer",
            fontSize: "14px", color: "#1976D2", fontWeight: 600, borderRight: "1px solid var(--color-border-light)"
          }}
        >
          EDIT
        </button>
        <button
          onClick={() => handleDeleteAddress(addr.id)}
          style={{
            flex: 1, padding: "16px 0", background: "none", border: "none", cursor: "pointer",
            fontSize: "14px", color: "#1976D2", fontWeight: 600
          }}
        >
          REMOVE
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#f5f5f6", minHeight: "100vh", maxWidth: "600px", margin: "0 auto", paddingBottom: "80px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 20px 10px" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", letterSpacing: "0.08em", margin: 0 }}>
          SAVED ADDRESSES
        </h1>
      </div>

      {/* Add New Address Button */}
      <div 
        style={{ padding: "16px 20px", backgroundColor: "white", display: "flex", alignItems: "center", cursor: "pointer", borderBottom: "1px solid var(--color-border-light)", borderTop: "1px solid var(--color-border-light)" }} 
        onClick={() => {
          setEditingAddressId(null);
          setAddressForm({
            fullName: "", phone: "", addressLine1: "", addressLine2: "",
            city: "", state: "", zipCode: "", country: "United States", isDefault: false,
          });
          setShowAddressForm(true);
        }}
      >
        <span style={{ fontSize: "12px", color: "#1976D2", fontWeight: 600 }}>
          + ADD NEW ADDRESS
        </span>
      </div>

      {showAddressForm && (
        <div style={{ borderBottom: "1px solid var(--color-border-light)", padding: "24px", position: "relative", backgroundColor: "white", marginBottom: "16px" }}>
          <button
            onClick={() => {
              setShowAddressForm(false);
              setEditingAddressId(null);
            }}
            style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "13px", letterSpacing: "0.12em", marginBottom: "24px" }}>
            {editingAddressId ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
          </h3>
          <form onSubmit={handleAddAddress}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>FULL NAME *</label>
                  <input value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} required placeholder="John Doe" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>PHONE *</label>
                  <input value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} required placeholder="+1 (555) 123-4567" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>ADDRESS LINE 1 *</label>
                <input value={addressForm.addressLine1} onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} required placeholder="123 Main St" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>ADDRESS LINE 2 (OPTIONAL)</label>
                <input value={addressForm.addressLine2} onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} placeholder="Apt, Suite, etc." style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>CITY *</label>
                  <input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required placeholder="City" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>STATE *</label>
                  <input value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} required placeholder="State" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>ZIP CODE *</label>
                  <input value={addressForm.zipCode} onChange={handleZipCodeChange} required placeholder="10001" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>COUNTRY *</label>
                  <input value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} required style={inputStyle} />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} style={{ accentColor: "var(--color-bg-dark)" }} />
                Set as default address
              </label>
              <button type="submit" className="btn-primary" disabled={addressLoading} style={{ opacity: addressLoading ? 0.7 : 1 }}>
                {addressLoading ? "SAVING..." : "SAVE ADDRESS"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses List */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        
        {defaultAddress && (
          <>
            <div style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 700, color: "#000" }}>
              DEFAULT ADDRESS
            </div>
            {renderAddressCard(defaultAddress)}
          </>
        )}

        {otherAddresses.length > 0 && (
          <>
            <div style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 700, color: "#000" }}>
              OTHER ADDRESSES
            </div>
            {otherAddresses.map(renderAddressCard)}
          </>
        )}

      </div>
    </div>
  );
}
