"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, Star, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/types";
import api from "@/lib/api";

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const featuredRef = useRef<HTMLDivElement>(null);
  const newArrivalsRef = useRef<HTMLDivElement>(null);
  const topRatedRef = useRef<HTMLDivElement>(null);

  const slideLeft = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -ref.current.offsetWidth, behavior: "smooth" });
    }
  };

  const slideRight = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: ref.current.offsetWidth, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [featuredRes, newRes, bestRes] = await Promise.allSettled([
          api.get("/api/v1/products/featured"),
          api.get("/api/v1/products/new-arrivals"),
          api.get("/api/v1/products/best-sellers"),
        ]);

        if (featuredRes.status === "fulfilled") setFeatured(featuredRes.value.data.data || []);
        if (newRes.status === "fulfilled") setNewArrivals(newRes.value.data.data || []);
        if (bestRes.status === "fulfilled") setBestSellers(bestRes.value.data.data || []);
      } catch {
        // API not available yet, use empty arrays
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <>
      {/* ─── HERO SECTION ─────────────────────────────────── */}
      <section
        style={{
          height: "85vh",
          minHeight: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          backgroundImage: "url('https://stylescapetheme.myshopify.com/cdn/shop/files/bellroy-bcaa-studio-print-06-2000x1334-a60580ea-9988-4c99-8075-17ea6c96ed99.webp?v=1768304463&width=2000')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Optional overlay to ensure text readability */}
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255, 255, 255, 0.2)" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "800px", padding: "0 20px" }}>
          <p style={{
            fontFamily: "var(--font-heading)", fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--color-text-secondary)", marginBottom: "24px",
          }}>
            SUMMER 2026 COLLECTION
          </p>

          <h1 style={{
            fontFamily: "var(--font-heading)", fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 500,
            letterSpacing: "0.06em", lineHeight: 1.05, marginBottom: "24px", textTransform: "uppercase",
          }}>
            SIMPLIFY<br />YOUR GO-CARRY
          </h1>

          <p style={{
            fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--color-text-secondary)",
            maxWidth: "480px", margin: "0 auto 40px", lineHeight: 1.7,
          }}>
            {/* Engineered for modern travelers. Premium bags and luggage built to go the distance. */}
            Carry everything you need, wherever life takes you.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/shop" className="btn-primary">
              Shop Collection
            </Link>
            <Link href="/shop?category=Travel" className="btn-outline">
              Explore Travel
            </Link>
          </div>
        </div>
      </section>
        {/* ─── NEW ARRIVALS ─────────────────────────────────── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg-white)" }}>
        <div className="container-main container-submain">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" }}>
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                JUST DROPPED
              </p>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "0.06em" }}>
                NEW ARRIVALS
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <Link href="/shop?sortBy=createdAt&sortOrder=desc" style={{
                fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em",
                textTransform: "uppercase", color: "var(--color-text-primary)", textDecoration: "none",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                VIEW ALL <ArrowRight size={14} />
              </Link>
              <div style={{ gap: "8px" }} className="hidden md:flex">
                <button 
                  onClick={() => slideLeft(newArrivalsRef)}
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "none",
                    cursor: "pointer",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%"
                  }}
                  aria-label="Previous new arrivals"
                >
                  <ChevronLeft size={16} strokeWidth={1.5} />
                </button>
                <button 
                  onClick={() => slideRight(newArrivalsRef)}
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "none",
                    cursor: "pointer",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%"
                  }}
                  aria-label="Next new arrivals"
                >
                  <ChevronRight size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          <div 
            ref={newArrivalsRef}
            className="no-scrollbar"
            style={{ 
              display: "flex", 
              gap: "24px", 
              overflowX: "auto", 
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth"
            }}
          >
            {(loading ? Array(4).fill(null) : newArrivals.slice(0, 8)).map((product, i) => (
              <div 
                key={product?.id || i} 
                className="slider-item"
              >
                {product ? (
                  <ProductCard product={product} />
                ) : (
                  <div style={{ aspectRatio: "4/5", backgroundColor: "var(--color-bg-cream)", animation: "pulse 2s infinite" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORY SHOWCASE ────────────────────────────── */}
      <section className="section-padding">
        <div className="container-main container-submain">
          <div className="category-showcase-grid no-scrollbar">
            {[
              { name: "Travel Luggage", desc: "For Every Journey", href: "/shop?category=Travel", color: "var(--color-cat-1)" },
              { name: "Backpacks", desc: "Work & Adventure", href: "/shop?category=Backpacks", color: "var(--color-cat-2)" },
              { name: "Accessories", desc: "Essential Extras", href: "/shop?category=Accessories", color: "var(--color-cat-3)" },
            ].map((cat) => (
              <Link key={cat.name} href={cat.href} className="category-showcase-item" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{
                  backgroundColor: cat.color,
                  padding: "48px 32px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "220px",
                  transition: "transform 0.3s ease",
                  cursor: "pointer",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div>
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
                      {cat.desc}
                    </p>
                    <h2 style={{ fontSize: "clamp(24px, 3vw, 32px)", letterSpacing: "0.06em", lineHeight: 1.1 }}>
                      {cat.name}
                    </h2>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                      SHOP NOW
                    </span>
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    

      {/* ─── FULL-WIDTH PROMO BANNER ──────────────────────── */}
      <section style={{
        backgroundColor: "var(--color-bg-dark)",
        color: "var(--color-text-inverse)",
        // padding: "clamp(60px, 10vw, 140px) 0",
        textAlign: "center",
      }}>
        <div className="container-main container-submain">
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.2em", opacity: 0.6, marginBottom: "24px", textTransform: "uppercase" }}>
            TECH SAVVY
          </p>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "0.06em", marginBottom: "16px", lineHeight: 1.05 }}>
            BUILT FOR THE<br />MODERN TRAVELER
          </h2>
          <p style={{ fontSize: "16px", opacity: 0.7, maxWidth: "520px", margin: "0 auto 40px", lineHeight: 1.7, fontFamily: "var(--font-body)" }}>
            From USB charging ports to TSA-approved locks, every detail is designed for the way you travel today.
          </p>
          <Link href="/shop?category=Backpacks" className="btn-outline" style={{ borderColor: "rgba(255,255,255,0.5)", color: "white" }}>
            EXPLORE BACKPACKS
          </Link>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ────────────────────────────── */}
      <section className="section-padding">
        <div className="container-main container-submain">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" }}>
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                CURATED FOR YOU
              </p>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "0.06em" }}>
                FEATURED
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <Link href="/shop" style={{
                fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em",
                textTransform: "uppercase", color: "var(--color-text-primary)", textDecoration: "none",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                VIEW ALL <ArrowRight size={14} />
              </Link>
              <div style={{ gap: "8px" }} className="hidden md:flex">
                <button 
                  onClick={() => slideLeft(featuredRef)}
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "none",
                    cursor: "pointer",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%"
                  }}
                  aria-label="Previous featured products"
                >
                  <ChevronLeft size={16} strokeWidth={1.5} />
                </button>
                <button 
                  onClick={() => slideRight(featuredRef)}
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "none",
                    cursor: "pointer",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%"
                  }}
                  aria-label="Next featured products"
                >
                  <ChevronRight size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          <div 
            ref={featuredRef}
            className="no-scrollbar"
            style={{ 
              display: "flex", 
              gap: "24px", 
              overflowX: "auto", 
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth"
            }}
          >
            {(loading ? Array(4).fill(null) : featured.slice(0, 8)).map((product, i) => (
              <div 
                key={product?.id || i} 
                className="slider-item"
              >
                {product ? (
                  <ProductCard product={product} />
                ) : (
                  <div style={{ aspectRatio: "4/5", backgroundColor: "var(--color-bg-cream)", animation: "pulse 2s infinite" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ─── TOP RATED ────────────────────────────────────── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg-white)" }}>
        <div className="container-main container-submain">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" }}>
            <div>
               <p style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                 HIGHLY RATED
               </p>
               <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "0.06em" }}>
                 TOP RATED
               </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <Link href="/shop" style={{
                fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em",
                textTransform: "uppercase", color: "var(--color-text-primary)", textDecoration: "none",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                VIEW ALL <ArrowRight size={14} />
              </Link>
              <div style={{ gap: "8px" }} className="hidden md:flex">
                <button 
                  onClick={() => slideLeft(topRatedRef)}
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "none",
                    cursor: "pointer",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%"
                  }}
                  aria-label="Previous top rated"
                >
                  <ChevronLeft size={16} strokeWidth={1.5} />
                </button>
                <button 
                  onClick={() => slideRight(topRatedRef)}
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "none",
                    cursor: "pointer",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%"
                  }}
                  aria-label="Next top rated"
                >
                  <ChevronRight size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          <div 
            ref={topRatedRef}
            className="no-scrollbar"
            style={{ 
              display: "flex", 
              gap: "24px", 
              overflowX: "auto", 
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth"
            }}
          >
            {(loading ? Array(4).fill(null) : bestSellers.slice(0, 8)).map((product, i) => (
              <div 
                key={product?.id || i} 
                className="slider-item"
              >
                {product ? (
                  <ProductCard product={product} />
                ) : (
                  <div style={{ aspectRatio: "4/5", backgroundColor: "var(--color-bg-cream)", animation: "pulse 2s infinite" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TWO-COLUMN PROMO ─────────────────────────────── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg-white)" }}>
        <div className="container-main container-submain">
          <div className="promo-showcase-grid no-scrollbar">
            <Link href="/shop?category=Premium+Luggage" className="promo-showcase-item" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{
                backgroundColor: "var(--color-promo-1)",
                color: "var(--color-promo-text-1)",
                padding: "30px 30px",
                maxHeight: "260px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.3s ease",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.01)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", opacity: 0.6, marginBottom: "12px" }}>PREMIUM COLLECTION</p>
                  <h3 style={{ fontSize: "clamp(16px, 2vw, 22px)", letterSpacing: "0.06em", lineHeight: 1.1, marginBottom: "16px" }}>
                    PRESTIGE<br />SERIES
                  </h3>
                  <p style={{ fontSize: "14px", opacity: 0.7, lineHeight: 1.6, fontFamily: "var(--font-body)" }}>Aircraft-grade aluminum. Lifetime warranty. The ultimate travel statement.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em" }}>DISCOVER</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </Link>

            <Link href="/shop?sortBy=ratings&sortOrder=desc" className="promo-showcase-item" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{
                backgroundColor: "var(--color-promo-2)",
                color: "var(--color-promo-text-2)",
                padding: "30px 30px",
                maxHeight: "260px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.3s ease",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.01)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", color: "var(--color-text-secondary)", marginBottom: "12px" }}>TOP RATED</p>
                  <h3 style={{ fontSize: "clamp(16px, 2vw, 22px)", letterSpacing: "0.06em", lineHeight: 1.1, marginBottom: "16px" }}>
                    BEST<br />SELLERS
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>Customer favorites rated 4.5 stars and above.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em" }}>SHOP NOW</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────── */}
      <section className="section-padding">
        <div className="container-main container-submain">
          <h2 style={{ textAlign: "center", fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "0.06em", marginBottom: "48px" }}>
            CUSTOMER REVIEWS
          </h2>

          <div className="category-showcase-grid no-scrollbar">
            {[
              { name: "Sarah M.", text: "The Swift Cabin is the best carry-on I've ever owned. Lightweight, durable, and stylish.", rating: 5, product: "Swift Cabin 20\" Carry-On" },
              { name: "James L.", text: "TechPro backpack fits everything I need for work. The laptop compartment is perfectly padded.", rating: 5, product: "TechPro Laptop Backpack" },
              { name: "Priya K.", text: "Bought the Navigator set for a family trip. All three bags are outstanding quality.", rating: 5, product: "Navigator 3-Piece Set" },
            ].map((review) => (
              <div key={review.name} className="category-showcase-item" style={{
                backgroundColor: "var(--color-bg-white)",
                padding: "32px",
                borderLeft: "3px solid var(--color-bg-dark)",
              }}>
                <div style={{ display: "flex", gap: "2px", marginBottom: "16px" }}>
                  {Array(review.rating).fill(null).map((_, i) => (
                    <Star key={i} size={14} fill="var(--color-bg-dark)" strokeWidth={0} />
                  ))}
                </div>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--color-text-primary)", marginBottom: "16px", fontStyle: "italic" }}>
                  &ldquo;{review.text}&rdquo;
                </p>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "12px", letterSpacing: "0.1em" }}>
                  {review.name}
                </p>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                  {review.product}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ───────────────────────────────────── */}
      {/* <section style={{ backgroundColor: "var(--color-bg-white)", padding: "clamp(60px, 8vw, 100px) 0", textAlign: "center" }}>
        <div className="container-main" style={{ maxWidth: "600px" }}>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "0.06em", marginBottom: "16px" }}>
            STAY IN THE LOOP
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "15px", marginBottom: "32px", lineHeight: 1.7 }}>
            Sign up for our newsletter and get 15% off your first order. Plus, be first to know about new arrivals and exclusive offers.
          </p>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: "0", maxWidth: "480px", margin: "0 auto" }}>
            <input
              type="email"
              placeholder="Enter your email address"
              style={{
                flex: 1,
                padding: "14px 20px",
                border: "1px solid var(--color-border)",
                borderRight: "none",
                fontSize: "14px",
                fontFamily: "var(--font-body)",
                outline: "none",
                backgroundColor: "transparent",
              }}
            />
            <button type="submit" className="btn-primary" style={{ borderRadius: 0 }}>
              SUBSCRIBE
            </button>
          </form>
        </div>
      </section> */}
    </>
  );
}
