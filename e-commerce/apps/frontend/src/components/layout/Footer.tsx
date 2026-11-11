"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on cart, checkout, and order-related pages
  if (pathname.startsWith("/cart") || pathname.startsWith("/checkout") || pathname.startsWith("/order")) {
    return null;
  }

  return (
    <footer style={{ backgroundColor: "#1A1A1A", color: "#FFFFFF", padding: "0 0 40px" }}>
      <div className="container-main">
        {/* Giant Logo */}
        <div style={{ textAlign: "center", marginBottom: "0px" }}>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(30px, 3vw, 70px)",
              fontWeight: 500,
              letterSpacing: "0.2em",
              opacity: 0.15,
              textTransform: "uppercase",
            }}
          >
            GoCarry
          </span>
        </div>

        {/* Footer Columns */}
        {/* <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", marginBottom: "60px" }}>
          <div>
            <h4 style={{ fontSize: "11px", letterSpacing: "0.15em", marginBottom: "20px", color: "rgba(255,255,255,0.6)" }}>SHOP</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {["Shop All", "Travel Luggage", "Backpacks", "Duffel Bags", "Accessories", "New Arrivals", "Best Sellers"].map((item) => (
                <li key={item}>
                  <Link href="/shop" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "14px", transition: "color 0.2s" }}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: "11px", letterSpacing: "0.15em", marginBottom: "20px", color: "rgba(255,255,255,0.6)" }}>HELP</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {["Contact Us", "FAQs", "Shipping & Returns", "Size Guide", "Track Order", "Warranty"].map((item) => (
                <li key={item}>
                  <Link href="#" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "14px" }}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: "11px", letterSpacing: "0.15em", marginBottom: "20px", color: "rgba(255,255,255,0.6)" }}>ABOUT</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {["Our Story", "Sustainability", "Careers", "Press", "Blog"].map((item) => (
                <li key={item}>
                  <Link href="#" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "14px" }}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: "11px", letterSpacing: "0.15em", marginBottom: "20px", color: "rgba(255,255,255,0.6)" }}>NEWSLETTER</h4>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginBottom: "16px", lineHeight: 1.6 }}>
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form style={{ display: "flex", gap: "0" }} onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRight: "none",
                  background: "transparent",
                  color: "white",
                  fontSize: "13px",
                  fontFamily: "var(--font-body)",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "12px 20px",
                  background: "white",
                  color: "#1A1A1A",
                  border: "none",
                  fontFamily: "var(--font-heading)",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                JOIN
              </button>
            </form>
          </div>
        </div> */}

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.15)",
            padding: "30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
            © {new Date().getFullYear()} Gocarry. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <Link key={item} href="#" style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
