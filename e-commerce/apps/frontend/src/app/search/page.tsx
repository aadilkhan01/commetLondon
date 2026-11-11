"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/types";
import api from "@/lib/api";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    api.get(`/api/v1/search?q=${encodeURIComponent(query)}`).then((res) => {
      if (res.data.success) setResults(res.data.data || []);
      setLoading(false);
    }).catch(() => {
      setResults([]);
      setLoading(false);
    });
  }, [query]);

  return (
    <div className="container-main container-submain">
      <h1 style={{ fontSize: "clamp(16px, 2vw, 22px)", letterSpacing: "0.06em", marginBottom: "8px" }}>
        SEARCH RESULTS
      </h1>
      <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "40px" }}>
        {results.length} results for &ldquo;{query}&rdquo;
      </p>

      {loading ? (
        <div className="product-grid">
          {Array(4).fill(null).map((_, i) => (
            <div key={i} style={{ aspectRatio: "4/5", backgroundColor: "var(--color-bg-cream)" }} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "18px", letterSpacing: "0.1em", marginBottom: "16px" }}>
            NO RESULTS FOUND
          </p>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
            Try different keywords or browse our collections.
          </p>
        </div>
      ) : (
        <div className="product-grid">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-main" style={{ padding: "80px 0", textAlign: "center" }}>Searching...</div>}>
      <SearchContent />
    </Suspense>
  );
}
