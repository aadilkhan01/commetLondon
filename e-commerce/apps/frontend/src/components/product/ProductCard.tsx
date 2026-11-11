"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/types";
import { useAuthStore, useCartStore, useWishlistStore } from "@/store";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { addItem, openCart } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const router = useRouter();
  const [animating, setAnimating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [animDirection, setAnimDirection] = useState<'vertical' | 'horizontal'>('vertical');
  const [isHovered, setIsHovered] = useState(false);

  const cardRef = useRef<HTMLAnchorElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showNotifyModal) {
      const timer = setTimeout(() => setShowNotifyModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotifyModal]);

  useEffect(() => {
    // Only apply IntersectionObserver on mobile devices
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.6 } // 60% of the card must be visible
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const active = isHovered || isVisible;
    if (!product.images || product.images.length <= 1 || !active) {
      setCurrentImageIndex(0);
      return;
    }

    let interval: NodeJS.Timeout;
    const timeout = setTimeout(() => {
      // Start animation after 1 second delay
      setAnimDirection('vertical');
      setCurrentImageIndex(1 % product.images.length);

      interval = setInterval(() => {
        setAnimDirection(prev => (prev === 'vertical' ? 'horizontal' : 'vertical'));
        setCurrentImageIndex(prev => (prev + 1) % product.images!.length);
      }, 2000);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [product.images, isHovered, isVisible]);

  const wishlisted = isInWishlist(product.id);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.discountPrice! / product.price) * 100) : 0;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) {
      setShowNotifyModal(true);
      return;
    }

    const cartItem = {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] || "",
      price: hasDiscount ? product.discountPrice! : product.price,
      quantity: 1,
      stock: product.stock,
      color: product.colors?.[0] || "",
    };

    // Optimistic update handles syncing automatically now
    addItem(cartItem);
    openCart();
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setAnimating(true);
    await toggleWishlist(product.id);
    setTimeout(() => setAnimating(false), 350);
  };

  return (
    <>
    <Link ref={cardRef} href={`/product/${product.slug}`} style={{ display: "block", height: "100%", textDecoration: "none", color: "inherit" }}>
      <div 
        className="product-card" 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className="product-image-wrapper">
          {hasDiscount && <span className="sale-badge">SALE</span>}
          {!hasDiscount && product.isNewArrival && <span className="new-badge">NEW</span>}

          {/* Wishlist Heart Button */}
          <button
            className={`wishlist-btn${wishlisted ? " active" : ""}${animating ? " animate" : ""}`}
            onClick={handleWishlistToggle}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={18} strokeWidth={1.8} className="wishlist-heart" />
          </button>

          {/* Out of Stock Overlay */}
          {product.stock <= 0 && (
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(0,0,0,0.8)", color: "white", padding: "8px 12px",
              fontFamily: "var(--font-heading)", fontSize: "12px", letterSpacing: "0.1em",
              zIndex: 15, whiteSpace: "nowrap", pointerEvents: "none"
            }}>
              OUT OF STOCK
            </div>
          )}

          {product.images && product.images.length > 0 ? (
            <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
              {product.images.map((img, index) => {
                const isActive = index === currentImageIndex;
                let transform = "translate(0, 0)";
                let opacity = 0;
                let zIndex = 1;

                if (isActive) {
                  transform = "translate(0, 0)";
                  opacity = product.stock <= 0 ? 0.4 : 1;
                  zIndex = 2;
                } else {
                  if (animDirection === 'vertical') {
                    transform = "translate(0, -100%)";
                  } else {
                    transform = "translate(100%, 0)";
                  }
                }

                return (
                  <img
                    key={index}
                    src={img}
                    alt={product.name}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: isActive ? "all 0.8s ease-in-out" : "none",
                      transform,
                      opacity,
                      zIndex,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--color-bg-cream)",
              fontFamily: "var(--font-heading)",
              fontSize: "13px",
              letterSpacing: "0.1em",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
            }}>
              {product.category}
            </div>
          )}

          {/* Quick Add / Notify */}
          <div style={{ position: "relative" }}>
            <button className="quick-add" onClick={handleQuickAdd} style={{ zIndex: 10, width: "100%" }}>
              {product.stock <= 0 ? "NOTIFY ME" : "ADD TO CART"}
            </button>
            {showNotifyModal && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "100%",
                marginTop: "4px",
                padding: "8px",
                backgroundColor: "var(--color-bg-dark)",
                color: "var(--color-text-inverse)",
                fontSize: "11px",
                fontFamily: "var(--font-body)",
                textAlign: "center",
                zIndex: 20,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                lineHeight: 1.4
              }}>
                We'll notify you at {user?.email || "your email"} when available!
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: "14px 0 0", overflow: "hidden", minWidth: 0 }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-body)", color: "var(--color-text-primary)", margin: "0 0 4px 0", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {product.name || product.brand}
          </h3>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "8px", fontFamily: "var(--font-body)", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {product.summary || product.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {hasDiscount ? (
              <>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>₹{product.discountPrice!.toFixed(2)}</span>
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)", textDecoration: "line-through" }}>₹{product.price.toFixed(2)}</span>
                <span style={{ fontSize: "11px", color: "var(--color-accent-red)", fontFamily: "var(--font-heading)", letterSpacing: "0.05em" }}>
                  -{discountPercent}%
                </span>
              </>
            ) : (
              <span style={{ fontSize: "14px", fontWeight: 600 }}>₹{product.price.toFixed(2)}</span>
            )}
          </div>
          {product.colors && product.colors.length > 0 && (
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "6px" }}>
              {product.colors.length} colors
            </p>
          )}
        </div>
      </div>
    </Link>
    </>
  );
}
