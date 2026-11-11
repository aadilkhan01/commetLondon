"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  FolderTree, 
  FileText, 
  Boxes, 
  Settings as SettingsIcon, 
  LogOut,
  User as UserIcon
} from "lucide-react";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!isAuthenticated || !user || user.role !== "ADMIN")) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted || !isAuthenticated || !user || user.role !== "ADMIN") {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--color-bg-primary)",
        fontFamily: "var(--font-heading)"
      }}>
        LOADING CONTROL PANEL...
      </div>
    );
  }

  const menuItems = [
    { name: "Dashboard", href: "/", icon: <LayoutDashboard size={18} /> },
    { name: "Products", href: "/products", icon: <ShoppingBag size={18} /> },
    { name: "Categories", href: "/categories", icon: <FolderTree size={18} /> },
    { name: "Orders", href: "/orders", icon: <FileText size={18} /> },
    { name: "Inventory", href: "/inventory", icon: <Boxes size={18} /> },
    { name: "Settings", href: "/settings", icon: <SettingsIcon size={18} /> },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: "260px",
        backgroundColor: "var(--color-bg-dark)",
        color: "var(--color-text-inverse)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "100vh",
        top: 0,
        left: 0,
        zIndex: 50
      }}>
        {/* Brand Header */}
        <div style={{
          padding: "24px",
          borderBottom: "1px solid #333",
          fontFamily: "var(--font-heading)",
          fontSize: "18px",
          letterSpacing: "0.15em",
          fontWeight: 500,
          textTransform: "uppercase"
        }}>
          GoCarry ADMIN
        </div>

        {/* User Info Card */}
        <div style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid #222"
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            fontSize: "14px"
          }}>
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{user.role}</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  color: isActive ? "var(--color-bg-dark)" : "#BBBBBB",
                  backgroundColor: isActive ? "var(--color-bg-primary)" : "transparent",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.2s ease"
                }}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div style={{ padding: "16px" }}>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              color: "#C75050",
              backgroundColor: "transparent",
              border: "1px solid #C75050",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: "var(--font-heading)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#C75050";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#C75050";
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        marginLeft: "260px",
        padding: "40px",
        backgroundColor: "var(--color-bg-primary)",
        minHeight: "100vh"
      }}>
        {children}
      </main>
    </div>
  );
}
