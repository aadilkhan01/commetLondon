"use client";

import Link from "next/link";
import { Search, ShoppingBag, User, Menu, Heart, Sun, Moon } from "lucide-react";
import { useCartStore, useUIStore, useAuthStore } from "@/store";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const { getItemCount, openCart } = useCartStore();
  const { toggleMobileMenu, toggleSearch } = useUIStore();
  const { isAuthenticated, user } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Hide the global header on cart, checkout, and order-related pages
  // if (pathname && (pathname.startsWith("/cart") || pathname.startsWith("/checkout") || pathname.startsWith("/order"))) {
  //   return null;
  // }

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    
    // Read the current class on mounting
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  };

  const itemCount = mounted ? getItemCount() : 0;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: scrolled ? "var(--color-bg-primary)" : "var(--color-bg-primary)",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: "none",
        transition: "all 0.3s ease",
        height: "var(--header-height)",
        boxShadow: "var(--header-shadow)",
        // boxShadow: scrolled ? "var(--header-shadow)" : "none"
      }}
    >
      <div
        className="container-main"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "100%",
          

        }}
      >
        {/* Left Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: "32px", flex: 1, }}>
          <Link
            href="/shop"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: "var(--color-text-primary)",
            }}
            className="hidden md:inline-block"
          >
            Shop All
          </Link>
          <Link
            href="/shop?category=Travel"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: "var(--color-text-primary)",
            }}
            className="hidden lg:inline-block"
          >
            Travel
          </Link>
          <Link
            href="/shop?category=Backpacks"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: "var(--color-text-primary)",
            }}
            className="hidden lg:inline-block"
          >
            Backpacks
          </Link>
          <Link
            href="/shop?category=Accessories"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: "var(--color-text-primary)",
            }}
            className="hidden lg:inline-block"
          >
            Accessories
          </Link>
        </nav>

        {/* Logo */}
        <Link
          href="/"
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

        {/* Right Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1, justifyContent: "flex-end" }}>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--color-text-primary)", display: "flex", alignItems: "center" }}
          >
            {theme === "dark" ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
          </button>

          <button
            onClick={toggleSearch}
            aria-label="Search"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
          >
            <Search size={20} strokeWidth={1.5} />
          </button>

          <Link
            href={isAuthenticated ? "/profile" : "/login"}
            aria-label="Account"
            style={{ color: "var(--color-text-primary)", padding: "4px" }}
            className="hidden sm:inline-block"
          >
            <User size={20} strokeWidth={1.5} />
          </Link>

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            title="Wishlist"
            style={{ color: "var(--color-text-primary)", padding: "4px" }}
            className="inline-block"
          >
            <Heart size={20} strokeWidth={1.5} />
          </Link>

          <Link
            href="/cart"
            aria-label="Cart"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              position: "relative",
              color: "var(--color-text-primary)",
            }}
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {itemCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "var(--color-bg-dark)",
                  color: "var(--color-text-inverse)",
                  fontSize: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {itemCount}
              </span>
            )}
          </Link>

          <button
            onClick={toggleMobileMenu}
            aria-label="Menu"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
            className="md:hidden"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
