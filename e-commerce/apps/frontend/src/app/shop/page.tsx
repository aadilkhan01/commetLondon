"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, ArrowLeft } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import type { Product, FilterOptions } from "@/types";
import api from "@/lib/api";

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [color, setColor] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (color) params.set("color", color);
      if (minPrice > 0) params.set("minPrice", minPrice.toString());
      if (maxPrice < 1000) params.set("maxPrice", maxPrice.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", page.toString());
      params.set("limit", "12");

      const res = await api.get(`/api/v1/products?${params.toString()}`);
      if (res.data.success) {
        if (page === 1) {
          setProducts(res.data.data || []);
        } else {
          setProducts(prev => [...prev, ...(res.data.data || [])]);
        }
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch {
      if (page === 1) setProducts([]);
    }
    setLoading(false);
  }, [category, color, sortBy, sortOrder, minPrice, maxPrice, page]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [category, color, sortBy, sortOrder, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || page >= totalPages) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage((prev) => prev + 1);
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => observer.disconnect();
  }, [loading, page, totalPages]);

  useEffect(() => {
    api.get("/api/v1/products/filters").then((res) => {
      if (res.data.success) setFilterOptions(res.data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setCategory(searchParams.get("category") || "");
  }, [searchParams]);

  const categories = ["Travel", "Backpacks", "Accessories", "School Bags", "Premium Luggage", "Duffel Bags"];
  const sortOptions = [
    { label: "Newest", sortBy: "createdAt", sortOrder: "desc" },
    { label: "Price: Low to High", sortBy: "price", sortOrder: "asc" },
    { label: "Price: High to Low", sortBy: "price", sortOrder: "desc" },
    { label: "Top Rated", sortBy: "ratings", sortOrder: "desc" },
    { label: "Name A-Z", sortBy: "name", sortOrder: "asc" },
  ];

  const clearFilters = () => {
    setCategory("");
    setColor("");
    setMinPrice(0);
    setMaxPrice(1000);
    setPage(1);
  };

  const hasActiveFilters = category || color || minPrice > 0 || maxPrice < 1000;

  return (
    <div className="container-main container-submain">
      {/* Page Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: "clamp(16px, 4vw, 16px)", letterSpacing: "0.06em", margin: 0 }}>
            {category || "SHOP ALL"}
          </h1>
        </div>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginTop: "8px" }}>
          {products.length} products
        </p>
      </div>

      {/* Controls Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "24px",
        borderBottom: "1px solid var(--color-border-light)",
        marginBottom: "32px",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "1px solid var(--color-border)",
            padding: "10px 20px",
            cursor: "pointer",
            fontFamily: "var(--font-heading)",
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          <SlidersHorizontal size={14} />
          FILTERS
          {hasActiveFilters && (
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-accent-red)" }} />
          )}
        </button>

        {/* Sort */}
        <div style={{ position: "relative" }}>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              setSortBy(sb);
              setSortOrder(so);
              setPage(1);
            }}
            style={{
              appearance: "none",
              background: "none",
              border: "1px solid var(--color-border)",
              padding: "10px 40px 10px 16px",
              fontFamily: "var(--font-heading)",
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {sortOptions.map((opt) => (
              <option key={opt.label} value={`${opt.sortBy}-${opt.sortOrder}`}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
          {category && (
            <span style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#1A1A1A", color: "#FFFFFF", fontSize: "11px", fontFamily: "var(--font-heading)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {category}
              <X size={12} style={{ cursor: "pointer" }} onClick={() => { setCategory(""); setPage(1); }} />
            </span>
          )}
          {color && (
            <span style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#1A1A1A", color: "#FFFFFF", fontSize: "11px", fontFamily: "var(--font-heading)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {color}
              <X size={12} style={{ cursor: "pointer" }} onClick={() => { setColor(""); setPage(1); }} />
            </span>
          )}
          <button onClick={clearFilters} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)", textDecoration: "underline" }}>
            CLEAR ALL
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "32px" }}>
        {/* Filter Sidebar */}
        {showFilters && (
          <>
            {/* Mobile Filter Backdrop overlay */}
            <div 
              onClick={() => setShowFilters(false)}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                zIndex: 999,
              }}
              className="lg:hidden"
            />
            
            <aside 
              style={{ width: "240px", flexShrink: 0, display: "none", position: "sticky", top: "100px", alignSelf: "flex-start" }} 
              className="mobile-filter-drawer lg:!block"
            >
              {/* Mobile Drawer Header */}
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  marginBottom: "20px",
                  borderBottom: "1px solid var(--color-border-light)",
                  paddingBottom: "16px"
                }}
                className="lg:hidden"
              >
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "14px", letterSpacing: "0.1em" }}>FILTERS</span>
                <button 
                  onClick={() => setShowFilters(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Category Filter */}
              <div className="filter-section">
                <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", marginBottom: "16px", textTransform: "uppercase" }}>
                  CATEGORY
                </h4>
                {categories.map((cat) => (
                  <label key={cat} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", cursor: "pointer", fontSize: "14px" }}>
                    <input
                      type="radio"
                      name="category"
                      checked={category === cat}
                      onChange={() => { setCategory(category === cat ? "" : cat); setPage(1); }}
                      style={{ accentColor: "var(--color-bg-dark)" }}
                    />
                    {cat}
                  </label>
                ))}
              </div>

              {/* Color Filter */}
              {filterOptions?.colors && filterOptions.colors.length > 0 && (
                <div className="filter-section">
                  <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", marginBottom: "16px", textTransform: "uppercase" }}>
                    COLOR
                  </h4>
                  {filterOptions.colors.map((c) => (
                    <label key={c} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", cursor: "pointer", fontSize: "14px", textTransform: "capitalize" }}>
                      <input
                        type="radio"
                        name="color"
                        checked={color === c}
                        onChange={() => { setColor(color === c ? "" : c); setPage(1); }}
                        style={{ accentColor: "var(--color-bg-dark)" }}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              )}

              {/* Price Range SECTION */}
              <div className="filter-section">
                <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", marginBottom: "16px", textTransform: "uppercase" }}>
                  PRICE RANGE
                </h4>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input type="number" placeholder="Min" value={minPrice || ""} onChange={(e) => setMinPrice(Number(e.target.value))}
                    style={{ width: "80px", padding: "8px", border: "1px solid var(--color-border)", fontSize: "13px", outline: "none" }} />
                  <span style={{ color: "var(--color-text-muted)" }}>–</span>
                  <input type="number" placeholder="Max" value={maxPrice >= 1000 ? "" : maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value) || 1000)}
                    style={{ width: "80px", padding: "8px", border: "1px solid var(--color-border)", fontSize: "13px", outline: "none" }} />
                </div>
              </div>

              {/* Mobile Drawer Apply Button */}
              <button 
                onClick={() => setShowFilters(false)}
                className="btn-primary lg:hidden"
                style={{ width: "100%", marginTop: "24px" }}
              >
                APPLY FILTERS
              </button>
            </aside>
          </>
        )}

        {/* Product Grid */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "24px" }}>
              {Array(8).fill(null).map((_, i) => (
                <div key={i} style={{ aspectRatio: "4/5", backgroundColor: "var(--color-bg-cream)" }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "18px", letterSpacing: "0.1em", marginBottom: "16px" }}>NO PRODUCTS FOUND</p>
              <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px" }}>Try adjusting your filters or search terms.</p>
              <button onClick={clearFilters} className="btn-primary">CLEAR FILTERS</button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Infinite Scroll Loader */}
              {page < totalPages && (
                <div ref={loaderRef} style={{ height: "40px", display: "flex", justifyContent: "center", alignItems: "center", marginTop: "40px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid var(--color-border)", borderTopColor: "var(--color-text-primary)", animation: "spin 1s linear infinite" }} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-main" style={{ padding: "80px 0", textAlign: "center" }}>Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
