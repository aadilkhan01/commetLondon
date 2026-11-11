"use client";

import Link from "next/link";
import { X, ChevronRight, User, Package, Heart } from "lucide-react";
import { useUIStore, useAuthStore } from "@/store";
import { useState } from "react";

const menuItems = [
  {
    label: "Shop All",
    href: "/shop",
    children: [],
  },
  {
    label: "Travel",
    href: "/shop?category=Travel",
    children: [
      { label: "Trolley Bags", href: "/shop?category=Travel&subCategory=Trolley+Bags" },
      { label: "Cabin Bags", href: "/shop?category=Travel&subCategory=Cabin+Bags" },
      { label: "Large Luggage", href: "/shop?category=Travel&subCategory=Large+Luggage" },
    ],
  },
  {
    label: "Backpacks",
    href: "/shop?category=Backpacks",
    children: [
      { label: "Laptop Backpack", href: "/shop?category=Backpacks&subCategory=Laptop+Backpack" },
      { label: "Office Backpack", href: "/shop?category=Backpacks&subCategory=Office+Backpack" },
      { label: "Casual Backpack", href: "/shop?category=Backpacks&subCategory=Casual+Backpack" },
    ],
  },
  {
    label: "Duffel Bags",
    href: "/shop?category=Duffel+Bags",
    children: [],
  },
  {
    label: "Accessories",
    href: "/shop?category=Accessories",
    children: [
      { label: "Travel Organizers", href: "/shop?category=Accessories&subCategory=Travel+Organizers" },
      { label: "Neck Pillows", href: "/shop?category=Accessories&subCategory=Neck+Pillows" },
      { label: "Toiletry Kits", href: "/shop?category=Accessories&subCategory=Toiletry+Kits" },
    ],
  },
  {
    label: "School Bags",
    href: "/shop?category=School+Bags",
    children: [],
  },
  {
    label: "Premium Luggage",
    href: "/shop?category=Premium+Luggage",
    children: [],
  },
];

export default function MobileMenu() {
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleExpand = (label: string) => {
    setExpandedItem(expandedItem === label ? null : label);
  };

  return (
    <>
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? "open" : ""}`}
        onClick={closeMobileMenu}
      />
      <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", borderBottom: "1px solid var(--color-border-light)", backgroundColor:"var(--color-bg-primary)", boxShadow:"var(--header-shadow)" }}>

       <Link
          href="/"
          onClick={closeMobileMenu}
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "28px",
            fontWeight: 500,
            letterSpacing: "0.2em",
            textDecoration: "none",
            color: "var(--color-text-primary)",
            textTransform: "uppercase",
          }}
        >
          GoCarry
        </Link>
          <button onClick={closeMobileMenu} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {/* Menu Items */}
        <nav style={{ padding: "8px 0" }}>
          {menuItems.map((item) => (
            <div key={item.label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 24px",
                  cursor: "pointer",
                }}
                onClick={() => item.children.length > 0 ? toggleExpand(item.label) : closeMobileMenu()}
              >
                {item.children.length > 0 ? (
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 400 }}>
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    style={{ fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 400, textDecoration: "none", color: "var(--color-text-primary)" }}
                  >
                    {item.label}
                  </Link>
                )}
                {item.children.length > 0 && (
                  <ChevronRight
                    size={16}
                    strokeWidth={1.5}
                    style={{
                      transform: expandedItem === item.label ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                )}
              </div>
              {/* Subcategories */}
              {expandedItem === item.label && item.children.length > 0 && (
                <div style={{ backgroundColor: "var(--color-bg-cream)", padding: "8px 0" }}>
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      onClick={closeMobileMenu}
                      style={{
                        display: "block",
                        padding: "10px 40px",
                        fontSize: "14px",
                        color: "var(--color-text-secondary)",
                        textDecoration: "none",
                      }}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom Links */}
        <div style={{ borderTop: "1px solid var(--color-border-light)", padding: "20px 24px", marginTop: "auto" }}>
          <Link
            href={isAuthenticated ? "/profile" : "/login"}
            onClick={closeMobileMenu}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", textDecoration: "none", color: "var(--color-text-primary)", fontSize: "14px" }}
          >
            <User size={18} strokeWidth={1.5} />
            {isAuthenticated ? "Profile" : "Sign In"}
          </Link>
          <Link
            href="/orders"
            onClick={closeMobileMenu}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", textDecoration: "none", color: "var(--color-text-primary)", fontSize: "14px" }}
          >
            <Package size={18} strokeWidth={1.5} />
            Orders
          </Link>
          <Link
            href="/wishlist"
            onClick={closeMobileMenu}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", textDecoration: "none", color: "var(--color-text-primary)", fontSize: "14px" }}
          >
            <Heart size={18} strokeWidth={1.5} />
            Wishlist
          </Link>
        </div>
      </div>
    </>
  );
}
