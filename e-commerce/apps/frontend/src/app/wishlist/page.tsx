"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft } from "lucide-react";
import { useAuthStore, useWishlistStore } from "@/store";
import ProductCard from "@/components/product/ProductCard";
import api from "@/lib/api";
import type { Product } from "@/types";

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore();
  const { items: wishlistIds, fetchWishlist, isLoaded: wishlistLoaded } = useWishlistStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login?redirect=/wishlist");
    }
  }, [isAuthenticated, mounted, router]);

  // Fetch wishlist ids when authenticated
  useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, mounted, fetchWishlist]);

  // Fetch product details for the wishlist ids
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
    if (isAuthenticated && wishlistLoaded) {
      fetchWishlistProducts();
    }
  }, [isAuthenticated, wishlistLoaded, fetchWishlistProducts]);

  if (!mounted || !isAuthenticated) {
    return null;
  }

  return (
    <div className="" style={{ minHeight: "calc(100vh - 200px)" }}>
      <div className="container-main container-submain">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(16px, 4vw, 16px)", letterSpacing: "0.08em", margin: 0 }}>
                WISHLIST
              </h1>
            </div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "8px" }}>
              {wishlistIds.length > 0 ? `${wishlistIds.length} ${wishlistIds.length === 1 ? 'item' : 'items'} saved` : 'No items saved'}
            </p>
          </div>
        </div>

        {loadingWishlist ? (
          <div className="product-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ aspectRatio: "4/5", backgroundColor: "var(--color-bg-cream)", borderRadius: "4px" }} />
            ))}
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 20px", border: "1px dashed var(--color-border)", borderRadius: "8px", backgroundColor: "var(--color-bg-cream)" }}>
            <Heart size={64} strokeWidth={1} style={{ color: "var(--color-text-muted)", margin: "0 auto 24px" }} />
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", letterSpacing: "0.05em", marginBottom: "12px" }}>
              YOUR WISHLIST IS EMPTY
            </h2>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", maxWidth: "400px", margin: "0 auto 32px", lineHeight: 1.6 }}>
              Save items you love by tapping the heart icon. They will show up here so you can easily find and add them to your cart.
            </p>
            <button onClick={() => router.push("/shop")} className="btn-primary">
              EXPLORE PRODUCTS
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
