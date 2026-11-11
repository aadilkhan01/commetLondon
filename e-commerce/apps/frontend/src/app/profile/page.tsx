"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Heart, LogOut, MapPin, User, Pencil, Plus, Trash2, X, ArrowLeft } from "lucide-react";
import { useAuthStore, useWishlistStore, useAddressStore } from "@/store";
import ProductCard from "@/components/product/ProductCard";
import api from "@/lib/api";
import type { Order, Product, Address } from "@/types";

type ProfileTab = "orders" | "addresses" | "wishlist" | "edit" | "overview";

export default function ProfilePage() {
  const { user, isAuthenticated, logout, updateUser } = useAuthStore();
  const { items: wishlistIds, fetchWishlist, isLoaded: wishlistLoaded } = useWishlistStore();
  const { addresses, fetchAddresses, addAddress, updateAddress, deleteAddress, isLoaded: addressesLoaded } = useAddressStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Edit profile state
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", mobile: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // Add address state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: "", phone: "", addressLine1: "", addressLine2: "",
    city: "", state: "", zipCode: "", country: "United States", isDefault: false,
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as ProfileTab | null;
      if (tab && ["orders", "addresses", "wishlist", "edit"].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login?redirect=/profile");
      return;
    }
    if (isAuthenticated) {
      // Fetch orders
      api.get("/api/v1/orders").then((res) => {
        if (res.data.success) setOrders(res.data.data || []);
      }).catch(() => {});

      // Fetch wishlist & addresses
      fetchWishlist();
      fetchAddresses();

      // Fetch fresh user profile
      api.get("/api/v1/users/profile").then((res) => {
        if (res.data.success) {
          const profile = res.data.data;
          updateUser({
            firstName: profile.firstName,
            lastName: profile.lastName,
            mobile: profile.mobile,
          });
          setEditForm({
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            mobile: profile.mobile || "",
          });
        }
      }).catch(() => {
        // Fallback to local user state
        if (user) {
          setEditForm({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            mobile: user.mobile || "",
          });
        }
      });
    }
  }, [isAuthenticated, mounted, router]);
  // Fetch wishlist products when tab switches to wishlist
  const fetchWishlistProducts = useCallback(async () => {
    if (wishlistIds.length === 0) {
      setWishlistProducts([]);
      return;
    }
    setLoadingWishlist(true);
    try {
      const res = await api.post("/api/v1/products/batch", { ids: wishlistIds });
      if (res.data.success) {
        setWishlistProducts(res.data.data || []);
      }
    } catch {}
    setLoadingWishlist(false);
  }, [wishlistIds]);

  useEffect(() => {
    if (activeTab === "wishlist") {
      fetchWishlistProducts();
    }
  }, [activeTab, fetchWishlistProducts]);


  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess(false);
    try {
      const res = await api.put("/api/v1/users/profile", editForm);
      if (res.data.success) {
        updateUser({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          mobile: editForm.mobile,
        });
        setEditSuccess(true);
        setTimeout(() => setEditSuccess(false), 3000);
      }
    } catch {}
    setEditLoading(false);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    let result = false;
    if (editingAddressId) {
      await updateAddress(editingAddressId, addressForm);
      result = true; // updateAddress doesn't return the address, but it doesn't return null if it succeeds (actually it returns void). We assume true.
    } else {
      const res = await addAddress(addressForm);
      if (res) result = true;
    }
    
    if (result) {
      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressForm({
        fullName: "", phone: "", addressLine1: "", addressLine2: "",
        city: "", state: "", zipCode: "", country: "United States", isDefault: false,
      });
    }
    setAddressLoading(false);
  };

  const handleEditAddress = (addr: Address) => {
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
  };

  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipCode = e.target.value;
    setAddressForm(prev => ({ ...prev, zipCode }));
    
    if (zipCode.length === 6 && /^\d+$/.test(zipCode)) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${zipCode}`);
        const data = await response.json();
        
        if (data && data[0] && data[0].Status === 'Success') {
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

  const isEditFormUnchanged = Boolean(user && editForm.firstName === (user.firstName || "") && editForm.lastName === (user.lastName || "") && editForm.mobile === (user.mobile || ""));

  if (!mounted || !isAuthenticated) return null;

  const tabs = [
    { id: "orders" as ProfileTab, label: "Recent Orders", icon: <Package size={16} /> },
    { id: "addresses" as ProfileTab, label: "Saved Addresses", icon: <MapPin size={16} /> },
    { id: "wishlist" as ProfileTab, label: "Wishlist", icon: <Heart size={16} /> },
    { id: "edit" as ProfileTab, label: "Edit Profile", icon: <Pencil size={16} /> },
  ];

  const inputStyle = {
    width: "100%", padding: "14px 16px", border: "1px solid var(--color-border)",
    fontSize: "14px", fontFamily: "var(--font-body)", outline: "none", backgroundColor: "transparent",
  };

  const labelStyle = {
    display: "block" as const, fontFamily: "var(--font-heading)", fontSize: "11px",
    letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: "8px",
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return { bg: "rgba(46,125,50,0.1)", color: "var(--color-accent-green)" };
      case "CANCELLED": return { bg: "rgba(199,80,80,0.1)", color: "var(--color-accent-red)" };
      case "SHIPPED": return { bg: "rgba(25,118,210,0.1)", color: "#1976D2" };
      case "PROCESSING": return { bg: "rgba(245,124,0,0.1)", color: "#F57C00" };
      default: return { bg: "rgba(26,26,26,0.08)", color: "var(--color-text-primary)" };
    }
  };

  return (
    <div className="container-main container-submain" style={{ paddingTop: "40px", paddingBottom: "80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: "clamp(16px, 4vw, 16px)", letterSpacing: "0.06em", margin: 0 }}>
          Profile
        </h1>
      </div>

      <div className="profile-layout">
        {/* Sidebar */}
        <div className="profile-sidebar">
          {/* User Info */}
          <div style={{ padding: "28px 24px", borderBottom: "1px solid var(--color-border-light)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "52px", height: "52px", borderRadius: "50%", background: "var(--color-bg-dark)",
                color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-heading)", fontSize: "16px", letterSpacing: "0.05em", flexShrink: 0,
              }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: "15px", fontWeight: 600, fontFamily: "var(--font-body)", textTransform: "none", letterSpacing: "normal", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.firstName} {user?.lastName}
                </h3>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ padding: "8px 0" }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`profile-nav-item${activeTab === tab.id ? " active" : ""}`}
                onClick={() => {
                  if (tab.id === "addresses") {
                    router.push("/address");
                  } else if (tab.id === "wishlist") {
                    router.push("/wishlist");
                  } else if (tab.id === "orders") {
                    router.push("/orders");
                  } else if (tab.id === "edit") {
                    router.push("/edit-profile");
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
              >
                {tab.icon} {tab.label}
                {tab.id === "wishlist" && wishlistIds.length > 0 && (
                  <span style={{
                    marginLeft: "auto", fontSize: "10px", fontFamily: "var(--font-heading)",
                    background: "var(--color-bg-dark)", color: "white", borderRadius: "50%",
                    width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {wishlistIds.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Sign Out */}
          <div style={{ padding: "8px 24px 24px" }}>
            <button
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "12px",
                background: "none", border: "1px solid var(--color-border)", cursor: "pointer",
                fontSize: "12px", fontFamily: "var(--font-heading)", letterSpacing: "0.1em",
                textTransform: "uppercase", width: "100%", justifyContent: "center",
              }}
            >
              <LogOut size={14} /> SIGN OUT
            </button>
          </div>
        </div>

        {/* Content */}
          {activeTab === "overview" &&(
            <div  className="profile-content " style={{ backgroundColor: "var(--color-bg-primary)", padding: "32px", border: "1px solid var(--color-border-light)" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "14px", letterSpacing: "0.15em", marginBottom: "28px" }}>
                PROFILE OVERVIEW
              </h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                <div>
                  <p style={{ fontSize: "11px", fontFamily: "var(--font-heading)", letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: "8px" }}>FULL NAME</p>
                  <p style={{ fontSize: "15px", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", fontFamily: "var(--font-heading)", letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: "8px" }}>EMAIL ADDRESS</p>
                  <p style={{ fontSize: "15px", fontWeight: 500 }}>{user?.email}</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", fontFamily: "var(--font-heading)", letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: "8px" }}>MOBILE NUMBER</p>
                  <p style={{ fontSize: "15px", fontWeight: 500 }}>{user?.mobile || "Not provided"}</p>
                </div>
              </div>

              <button 
                onClick={() => router.push("/edit-profile")} 
                className="btn-outline" 
                style={{ padding: "10px 24px", fontSize: "12px" }}
              >
                EDIT PROFILE
              </button>
            </div>
          )}
        
      </div>
    </div>
  );
}
