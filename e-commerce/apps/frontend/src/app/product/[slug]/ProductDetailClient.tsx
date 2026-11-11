"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Star, Minus, Plus, Heart, ChevronLeft, ChevronRight, Check, Truck, Shield, RotateCcw, Share2, MessageCircle, Mail, Link2, X, Radius } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { useAuthStore, useCartStore, useWishlistStore } from "@/store";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import api from "@/lib/api";

const XBrandIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="black" />
    <path fill="white" d="M14.258 10.152L23.176 0h-2.113l-7.747 8.813L7.133 0H0l9.352 13.328L0 24h2.113l8.177-9.309L16.867 24H24l-9.742-13.848zM11.4 13.432l-1.054-1.477L2.94 1.5h3.243l5.88 8.243 1.054 1.477 7.743 10.852h-3.243l-6.217-8.64z" transform="scale(0.6) translate(8, 8)" />
  </svg>
);

const FacebookBrandIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path fill="white" d="M15.4 12H13v7h-3v-7H8v-3h2V7.7c0-2 1.2-3.1 3.1-3.1h2.2v2.8h-1.4c-1 0-1.2.5-1.2 1.2V9h2.7l-.3 3z" />
  </svg>
);

const PinterestBrandIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24">
    <circle cx="12" cy="12" r="12" fill="#E60023" />
    <path fill="white" d="M12 4.5c-4.1 0-7.5 3.4-7.5 7.5 0 3.2 2 6 4.8 7.1-.1-.6-.1-1.5 0-2.2l1-4.2s-.3-.5-.3-1.3c0-1.2.7-2.1 1.6-2.1.7 0 1.1.5 1.1 1.2 0 .8-.5 1.9-.8 2.9-.2.8.4 1.5 1.2 1.5 1.4 0 2.5-1.5 2.5-3.7 0-1.9-1.4-3.3-3.3-3.3-2.3 0-3.6 1.7-3.6 3.5 0 .8.3 1.6.7 2 .1.1.1.2 0 .3l-.2.9c0 .1-.1.1-.3 0-1.2-.5-1.9-2.2-1.9-3.5 0-2.8 2-5.4 5.9-5.4 3.1 0 5.5 2.2 5.5 5.2 0 3.1-2 5.6-4.7 5.6-.9 0-1.8-.5-2.1-1l.6-2.2c.1-.4.2-.8.3-1.1.1-.5.3-.9.3-1 0-.9 1-1.6 2-1.6 2.4 0 4.2 2 4.2 4.9 0 3.6-2.3 6.4-5.4 6.4-1.3 0-2.5-.7-2.9-1.4l-.8 3c-.3 1.1-1.1 2.5-1.6 3.4 1 .3 2.1.5 3.3.5 4.1 0 7.5-3.4 7.5-7.5 0-4.1-3.4-7.5-7.5-7.5z" />
  </svg>
);

const ProductActions = ({
  product,
  isAuthenticated,
  currentStock,
  remainingAllowed,
  handleAddToCart,
  isInWishlist,
  toggleWishlist,
  wishlistAnimating,
  setWishlistAnimating,
  showNotifyModal,
  user,
  router,
  isItemInCart,
  handleGoToCart,
}: {
  product: Product;
  isAuthenticated: boolean;
  currentStock: number;
  remainingAllowed: number;
  handleAddToCart: () => void;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (id: string) => Promise<void>;
  wishlistAnimating: boolean;
  setWishlistAnimating: (animating: boolean) => void;
  showNotifyModal: boolean;
  user: any;
  router: any;
  isItemInCart?: boolean;
  handleGoToCart?: () => void;
}) => {
  return (
    <div className="responsive-sticky-actions">
      <div style={{ flex: 1, position: "relative", height: "48px" }}>
        <button 
          onClick={isItemInCart ? handleGoToCart : handleAddToCart} 
          className="btn-primary detail-add-to-cart-btn" 
          disabled={!isItemInCart && isAuthenticated && (currentStock <= 0 || remainingAllowed <= 0)}
          style={{ 
            opacity: (!isItemInCart && isAuthenticated && (currentStock <= 0 || remainingAllowed <= 0)) ? 0.7 : 1,
            cursor: (!isItemInCart && isAuthenticated && (currentStock <= 0 || remainingAllowed <= 0)) ? "not-allowed" : "pointer"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "none" }}>
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span className="mobile-only-text" style={{ display: "none" }}>
            {isItemInCart 
              ? "GO TO BAG"
              : currentStock <= 0 && isAuthenticated
                ? "NOTIFY ME" 
                : isAuthenticated && remainingAllowed <= 0 
                  ? "LIMIT REACHED" 
                  : "ADD TO BAG"
            }
          </span>
          <span className="desktop-only-text" style={{ display: "inline" }}>
            {isItemInCart 
              ? "GO TO CART"
              : currentStock <= 0 && isAuthenticated
                ? "NOTIFY ME" 
                : isAuthenticated && remainingAllowed <= 0 
                  ? "LIMIT REACHED" 
                  : "ADD TO CART"
            }
          </span>
        </button>
        {showNotifyModal && (
          <div className="notify-tooltip" style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            marginTop: "8px",
            padding: "12px",
            backgroundColor: "var(--color-bg-dark)",
            color: "var(--color-text-inverse)",
            fontSize: "12px",
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
  );
};

export default function ProductDetailClient({ initialProduct }: { initialProduct: Product }) {
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(initialProduct?.colors?.[0] || null);
  const [wishlistAnimating, setWishlistAnimating] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { items, addItem, openCart } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();

  const isItemInCart = items.some((i) => i.productId === product?.id && (!selectedColor || i.color === selectedColor));
  const handleGoToCart = () => router.push("/cart");

  const [isStickyCartVisible, setIsStickyCartVisible] = useState(false);
  const inlineActionsRef = useRef<HTMLDivElement>(null);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [wheelCooldown, setWheelCooldown] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'specifications'>('details');
  
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (product?.id) {
      api.get(`/api/v1/products/${product.id}/reviews`)
        .then(res => {
          if (res.data.success) {
            setReviews(res.data.data);
          }
        })
        .catch(console.error);
    }
  }, [product?.id]);

  const handleShareCopy = async () => {
    if (typeof window !== "undefined") {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(window.location.href);
        } else {
          // fallback for non-secure contexts (like testing on local IP over HTTP)
          const textArea = document.createElement("textarea");
          textArea.value = window.location.href;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
          } catch (error) {
            console.error('Fallback copy failed', error);
          } finally {
            textArea.remove();
          }
        }
        setShareCopied(true);
        setTimeout(() => {
          setShareCopied(false);
          setShowShareMenu(false);
        }, 2000);
      } catch (err) {
        console.error("Copy failed:", err);
      }
    }
  };

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      const shareUrl = window.location.href;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile && navigator.share) {
        try {
          await navigator.share({
            title: product?.name || "GoCarry Product",
            text: product?.description || "",
            url: shareUrl
          });
        } catch (err) {
          // ignore
        }
      } else {
    setShowShareMenu(prev => !prev);
      }
    }
  };
  const router = useRouter();

  const activeVariant = product?.variants?.find((v) => v.color === selectedColor);
  const currentStock = activeVariant ? activeVariant.stock : (product?.stock ?? 0);
  
  const hasVariantDiscount = !!(activeVariant && activeVariant.discountPrice && activeVariant.discountPrice > 0 && activeVariant.discountPrice < activeVariant.price);
  const currentPrice = activeVariant 
    ? (hasVariantDiscount ? activeVariant.discountPrice! : activeVariant.price)
    : (product?.discountPrice || product?.price || 0);
  
  const currentOriginalPrice = activeVariant 
    ? activeVariant.price 
    : (product?.price || 0);
    
  const isCurrentlyDiscounted = activeVariant 
    ? hasVariantDiscount 
    : !!(product?.discountPrice && product.discountPrice < product.price);

  const saveAmount = isCurrentlyDiscounted ? (currentOriginalPrice - currentPrice) : 0;
  const currentSKU = activeVariant ? activeVariant.sku : (product?.sku || "");

  const existingCartItem = items.find((item) => item.productId === product?.id && item.color === selectedColor);
  const existingQuantity = existingCartItem ? existingCartItem.quantity : 0;
  const remainingAllowed = product ? Math.max(0, Math.min(3 - existingQuantity, currentStock - existingQuantity)) : 3;
  const maxQuantity = product ? Math.max(1, remainingAllowed) : 3;

  // Filter images: Keep if it matches the selected color, OR if it is a general image (doesn't match any other color).
  const filteredImages = (() => {
    if (!product || !product.images) return [];
    if (!selectedColor || !product.colors || product.colors.length === 0) return product.images;
    
    const isImageMatchingColor = (imgUrl: string, color: string) => {
      const lowerImg = imgUrl.toLowerCase();
      const normalizedColor = color.toLowerCase().replace(/\s+/g, '-');
      const normalizedColorNoSpaces = color.toLowerCase().replace(/\s+/g, '');
      
      return lowerImg.includes(`-${normalizedColor}`) || 
             lowerImg.includes(`_${normalizedColor}`) ||
             lowerImg.includes(`#${normalizedColor}`) ||
             lowerImg.includes(`?color=${normalizedColor}`) ||
             lowerImg.includes(`&color=${normalizedColor}`) ||
             lowerImg.includes(`=${normalizedColor}`) ||
             lowerImg.includes(`/${normalizedColor}`) ||
             
             lowerImg.includes(`-${normalizedColorNoSpaces}`) ||
             lowerImg.includes(`_${normalizedColorNoSpaces}`) ||
             lowerImg.includes(`#${normalizedColorNoSpaces}`) ||
             lowerImg.includes(`?color=${normalizedColorNoSpaces}`) ||
             lowerImg.includes(`&color=${normalizedColorNoSpaces}`) ||
             lowerImg.includes(`=${normalizedColorNoSpaces}`) ||
             lowerImg.includes(`/${normalizedColorNoSpaces}`) ||
             
             color.split(' ').some(word => word.length > 2 && (
               lowerImg.includes(`-${word.toLowerCase()}`) ||
               lowerImg.includes(`_${word.toLowerCase()}`) ||
               lowerImg.includes(`#${word.toLowerCase()}`)
             ));
    };

    const matched = product.images.filter(img => {
      // 1. Matches the currently selected color
      if (isImageMatchingColor(img, selectedColor)) {
        return true;
      }
      
      // 2. If it matches any OTHER color in the list, we hide it
      const matchesAnyOtherColor = product.colors!.some(otherColor => 
        otherColor !== selectedColor && isImageMatchingColor(img, otherColor)
      );
      
      // If it doesn't match other colors, it's general
      return !matchesAnyOtherColor;
    });

    return matched.length > 0 ? matched : product.images;
  })();

  // Reset image index when color changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedColor]);

  useEffect(() => {
    if (product && remainingAllowed > 0 && quantity > remainingAllowed) {
      setQuantity(remainingAllowed);
    }
  }, [remainingAllowed, quantity, product]);

  useEffect(() => {
    if (showNotifyModal) {
      const timer = setTimeout(() => setShowNotifyModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotifyModal]);

  useEffect(() => {
    if (product) {
      api.get(`/api/v1/products?category=${product.category}&limit=4`).then((r) => {
        if (r.data.success) {
          setRelated((r.data.data || []).filter((p: Product) => p.id !== product.id).slice(0, 4));
        }
      }).catch(() => {});
    }
  }, [product]);

  useEffect(() => {
    const handleScroll = () => {
      if (inlineActionsRef.current) {
        const rect = inlineActionsRef.current.getBoundingClientRect();
        // The sticky bar has height of 64px (48px button + 16px padding)
        const triggerPoint = window.innerHeight - 64;
        
        // Sticky bar is visible ONLY when the inline bar is below this trigger point (out of view)
        setIsStickyCartVisible(rect.top > triggerPoint);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run initially with a delay to ensure element is rendered
    const initialTimer = setTimeout(handleScroll, 100);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(initialTimer);
    };
  }, [product]);



  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null || !filteredImages) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe && filteredImages.length > 1) {
      setCurrentImageIndex((prev) => (prev === filteredImages.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe && filteredImages.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? filteredImages.length - 1 : prev - 1));
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsMouseDown(true);
    setTouchEnd(null);
    setTouchStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (imageContainerRef.current) {
      const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
      let x = ((e.clientX - left) / width) * 100;
      let y = ((e.clientY - top) / height) * 100;
      
      // Clamp values between 0 and 100 to prevent lens from going completely out of bounds
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
      
      setZoomPos({ x, y });
    }

    if (!isMouseDown) return;
    setTouchEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);
    if (touchStart === null || touchEnd === null || !filteredImages) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe && filteredImages.length > 1) {
      setCurrentImageIndex((prev) => (prev === filteredImages.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe && filteredImages.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? filteredImages.length - 1 : prev - 1));
    }
  };

  const onMouseLeave = () => {
    if (isMouseDown) {
      onMouseUp();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Only care about horizontal swipes (trackpad/mousepad scroll)
    if (Math.abs(e.deltaX) < 30 || wheelCooldown) return;
    
    // Set cooldown so we don't rapid-fire slides
    setWheelCooldown(true);
    setTimeout(() => setWheelCooldown(false), 500); // 500ms cooldown
    
    if (e.deltaX > 0 && filteredImages && filteredImages.length > 1) {
      // Swipe left / scroll right -> next image
      setCurrentImageIndex((prev) => (prev === filteredImages.length - 1 ? 0 : prev + 1));
    } else if (e.deltaX < 0 && filteredImages && filteredImages.length > 1) {
      // Swipe right / scroll left -> previous image
      setCurrentImageIndex((prev) => (prev === 0 ? filteredImages.length - 1 : prev - 1));
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (currentStock <= 0) {
      if (!isAuthenticated) { router.push("/login"); return; }
      setShowNotifyModal(true);
      return;
    }

    if (isAuthenticated && remainingAllowed <= 0) {
      return;
    }

    const finalQuantity = isAuthenticated ? Math.min(quantity, remainingAllowed) : quantity;
    if (finalQuantity <= 0) return;

    const cartItem = {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: filteredImages?.[0] || product.images?.[0] || "",
      price: currentPrice,
      quantity: finalQuantity,
      stock: currentStock,
      color: selectedColor || undefined,
    };

    // Optimistic update handles syncing automatically now
    addItem(cartItem);
    openCart();
  };

  if (loading) {
    return (
      <div className="container-main" style={{ padding: "80px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
          <div style={{ aspectRatio: "4/5", backgroundColor: "var(--color-bg-cream)" }} />
          <div style={{ padding: "20px 0" }}>
            <div style={{ height: "20px", width: "100px", backgroundColor: "var(--color-bg-cream)", marginBottom: "16px" }} />
            <div style={{ height: "32px", width: "80%", backgroundColor: "var(--color-bg-cream)", marginBottom: "24px" }} />
            <div style={{ height: "24px", width: "120px", backgroundColor: "var(--color-bg-cream)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-main" style={{ padding: "120px 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", letterSpacing: "0.1em", marginBottom: "16px" }}>PRODUCT NOT FOUND</h1>
        <button onClick={() => router.push("/shop")} className="btn-primary">BACK TO SHOP</button>
      </div>
    );
  }

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div className="container-main container-submain">
      {/* Breadcrumb */}
      <nav style={{display:"none", marginBottom: "32px", fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "var(--font-heading)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}>Home</span>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/shop")}>Shop</span>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(`/shop?category=${product.category}`)}>{product.category}</span>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "var(--color-text-primary)" }}>{product.name}</span>
      </nav>

      {/* Product Layout */}
      <div className="product-detail-layout">
        {/* Gallery */}
        <div 
          ref={imageContainerRef}
          onWheel={handleWheel} 
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          style={{ aspectRatio: "4/5", backgroundColor: "var(--color-bg-cream)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontSize: "18px", color: "var(--color-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", position: "relative", overflow: "visible" }}
        >
          {hasDiscount && <span className="sale-badge" style={{ zIndex: 10 }}>SALE</span>}
          
          {/* Share Button (Absolute floating on the right side) */}
          <div style={{ position: "absolute", top: "24px", right: "24px", zIndex: 20 }}>
            <button
              onClick={handleShare}
              style={{
                width: "30px", height: "30px",
                borderRadius: "50%",
                backgroundColor: "var(--color-bg-white)",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                color: "var(--color-text-primary)",
              }}
              aria-label="Share product"
            >
              <Share2 size={16} strokeWidth={1.5} />
            </button>
            {showShareMenu && (
              <div style={{
                position: "absolute",
                top: "48px",
                right: 0,
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: "12px",
                width: "180px",
                zIndex: 30,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                display: "flex",
                flexDirection: "column",
                overflow: "visible",
              }}>
                {/* Tooltip arrow */}
                <div style={{
                  position: "absolute",
                  top: "-7px",
                  right: "24px",
                  width: "14px",
                  height: "14px",
                  backgroundColor: "#fff",
                  borderTop: "1px solid #ddd",
                  borderLeft: "1px solid #ddd",
                  transform: "rotate(45deg)",
                  zIndex: -1,
                }} />
                
                {/* Close Button */}
                <button 
                  onClick={() => setShowShareMenu(false)}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "20px",
                    height: "2  0px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "2px solid #888",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "black",
                  }}
                  aria-label="Close share menu"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <a 
                    href={`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} 
                    style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", fontWeight: "500", textDecoration: "none", color: "black", padding: "10px 16px", borderBottom: "1px solid #eee" }}
                    onClick={() => setShowShareMenu(false)}
                  >
                    <Mail size={24} strokeWidth={2} /> Email
                  </a>
                  <a 
                    href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&description=${encodeURIComponent(product.name)}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", fontWeight: "500", textDecoration: "none", color: "black", padding: "10px 16px", borderBottom: "1px solid #eee" }}
                    onClick={() => setShowShareMenu(false)}
                  >
                    <PinterestBrandIcon /> Pinterest
                  </a>
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", fontWeight: "500", textDecoration: "none", color: "black", padding: "10px 16px", borderBottom: "1px solid #eee" }}
                    onClick={() => setShowShareMenu(false)}
                  >
                    <FacebookBrandIcon /> Facebook
                  </a>
                  <a 
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(product.name)}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", fontWeight: "500", textDecoration: "none", color: "black", padding: "10px 16px", borderBottom: "1px solid #eee" }}
                    onClick={() => setShowShareMenu(false)}
                  >
                    <XBrandIcon /> X
                  </a>
                  <button 
                    onClick={handleShareCopy} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "16px", 
                      fontSize: "12px",
                      fontWeight: "500",
                      border: "none", 
                      background: "none", 
                      color: shareCopied ? "#4CAF50" : "black",
                      padding: "10px 16px", 
                      cursor: "pointer", 
                      width: "100%", 
                      textAlign: "left",
                    }}
                  >
                    <Link2 size={24} strokeWidth={2.5} /> {shareCopied ? "Copied" : "Copy Link"}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Out of Stock Overlay */}
          {product.stock <= 0 && (
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(0,0,0,0.8)", color: "white", padding: "12px 24px",
              fontFamily: "var(--font-heading)", fontSize: "16px", letterSpacing: "0.1em",
              zIndex: 15, whiteSpace: "nowrap", pointerEvents: "none"
            }}>
              OUT OF STOCK
            </div>
          )}
          
          {filteredImages && filteredImages.length > 0 ? (
            <>
              <div 
                style={{ 
                  width: "100%", height: "100%", 
                  display: "flex", 
                  overflowX: "auto", 
                  scrollSnapType: "x mandatory",
                  scrollBehavior: "smooth",
                  WebkitOverflowScrolling: "touch",
                }}
                className="no-scrollbar"
                ref={(node) => {
                  if (node) {
                    node.scrollLeft = currentImageIndex * node.offsetWidth;
                  }
                }}
                onScroll={(e) => {
                  const node = e.currentTarget;
                  const index = Math.round(node.scrollLeft / node.offsetWidth);
                  if (index !== currentImageIndex && index >= 0 && index < filteredImages.length) {
                    setCurrentImageIndex(index);
                  }
                }}
              >
                {filteredImages.map((img, i) => (
                  <img 
                    key={i}
                    src={img} 
                    alt={`${product.name} - image ${i + 1}`} 
                    style={{ 
                      flex: "0 0 100%", 
                      width: "100%", height: "100%", 
                      objectFit: "cover", 
                      scrollSnapAlign: "start",
                      opacity: product.stock <= 0 ? 0.4 : 1,
                      cursor: "crosshair"
                    }} 
                    onMouseMove={onMouseMove}
                    draggable={false}
                  />
                ))}
              </div>
              
              {/* Rating overlay pill */}
              <div style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(4px)",
                padding: "6px 10px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "2px",
                fontSize: "13px",
                fontWeight: "600",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                zIndex: 20,
              }}>
                {product.ratings}
                <Star size={12} fill="#14958f" stroke="#14958f" />
                <span style={{ color: "#d4d5d9", margin: "0 4px" }}>|</span>
                <span style={{ color: "#535766", fontWeight: "400" }}>{product.reviewsCount >= 1000 ? (product.reviewsCount / 1000).toFixed(1) + 'k' : product.reviewsCount}</span>
              </div>

              {filteredImages.length > 1 && (
                <div style={{ position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px", zIndex: 10 }}>
                  {filteredImages.map((_, i) => (
                    <div
                      key={i}
                      style={{ 
                        width: i === currentImageIndex ? "16px" : "6px", 
                        height: "6px", 
                        borderRadius: "3px", 
                        background: i === currentImageIndex ? "var(--color-bg-dark)" : "rgba(0,0,0,0.2)", 
                        transition: "all 0.3s ease" 
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Zoom Lens overlay on main image */}
              {isZooming && typeof window !== 'undefined' && window.innerWidth >= 1024 && product.stock > 0 && (
                <div style={{
                  position: "absolute",
                  left: `${zoomPos.x}%`,
                  top: `${zoomPos.y}%`,
                  width: "120px",
                  height: "120px",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "rgba(0, 100, 255, 0.1)",
                  border: "1px solid rgba(0, 100, 255, 0.4)",
                  pointerEvents: "none",
                  zIndex: 25,
                }} />
              )}
              
              {/* Zoomed Output Pane beside the main image */}
              {isZooming && typeof window !== 'undefined' && window.innerWidth >= 1024 && product.stock > 0 && (
                <div style={{
                  position: "absolute",
                  left: "calc(100% + 40px)",
                  top: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 50,
                  backgroundColor: "var(--color-bg-white)",
                  backgroundImage: `url(${filteredImages[currentImageIndex]})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: "250%",
                  backgroundRepeat: "no-repeat",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                  pointerEvents: "none",
                  border: "1px solid var(--color-border)",
                }} />
              )}
            </>
          ) : (
            product.category
          )}
        </div>

        {/* Product Info */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: "700", margin: 0, fontFamily: "var(--font-body)", letterSpacing: 0, color: "#282c3f" }}>
                {product.name||product.brand}
              </h1>
              <p style={{ fontSize: "16px", color: "#535766", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                {product.summary || product.name}
              </p>
            </div>
            
            <button
              onClick={async () => {
                setWishlistAnimating(true);
                await toggleWishlist(product.id);
                setTimeout(() => setWishlistAnimating(false), 350);
              }}
              style={{
                width: "40px", height: "40px",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                background: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease",
                transform: wishlistAnimating ? "scale(1.15)" : "scale(1)",
                flexShrink: 0,
                marginLeft: "16px"
              }}
              aria-label={product && isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                size={20}
                strokeWidth={1.5}
                fill={product && isInWishlist(product.id) ? "#E53935" : "none"}
                color={product && isInWishlist(product.id) ? "#E53935" : "#282c3f"}
              />
            </button>
          </div>

          {/* Price */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
            {isCurrentlyDiscounted ? (
              <>
                <span style={{ fontSize: "18px", fontWeight: 600 }}>₹{currentPrice.toFixed(2)}</span>
                <span style={{ fontSize: "18px", color: "var(--color-text-muted)", textDecoration: "line-through" }}>₹{currentOriginalPrice.toFixed(2)}</span>
                 
                <span style={{ fontSize: "13px", color: "var(--color-accent-red)", fontFamily: "var(--font-heading)", letterSpacing: "0.05em", padding: "4px 8px", backgroundColor: "rgba(199, 80, 80, 0.1)" ,borderRadius:"20px"}}>
                 
                  SAVE ₹{saveAmount.toFixed(2)}
                </span>
              </>
            ) : (
              <span style={{ fontSize: "28px", fontWeight: 600 }}>₹{currentPrice.toFixed(2)}</span>
            )}
          </div>


          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", marginBottom: "12px", textTransform: "uppercase" }}>
                COLOR: <span style={{ fontFamily: "var(--font-body)", letterSpacing: "normal", textTransform: "capitalize" }}>{selectedColor}</span>
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      padding: "8px 16px",
                      border: selectedColor === color ? "2px solid var(--color-bg-dark)" : "1px solid var(--color-border)",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
           {/* Stock */}
           <p style={{ fontSize: "13px", color: currentStock > 0 ? "var(--color-accent-green)" : "var(--color-accent-red)", marginBottom: "28px" }}>
            {currentStock > 0&&currentStock<4 ? `Only ${currentStock} left!` :currentStock > 0 ? `✓ In stock` : "✗ Out of stock"}
          </p>

          {/* Add to Cart */}
          <div ref={inlineActionsRef} style={{ marginBottom: "20px" }}>
            {product && (
              <ProductActions
                product={product}
                isAuthenticated={isAuthenticated}
                currentStock={currentStock}
                remainingAllowed={remainingAllowed}
                handleAddToCart={handleAddToCart}
                isInWishlist={isInWishlist}
                toggleWishlist={toggleWishlist}
                wishlistAnimating={wishlistAnimating}
                setWishlistAnimating={setWishlistAnimating}
                showNotifyModal={showNotifyModal}
                user={user}
                router={router}
                isItemInCart={isItemInCart}
                handleGoToCart={handleGoToCart}
              />
            )}
                   {/* Mobile Sticky Add to Cart Bar */}
      {isStickyCartVisible && product && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: "16px",
          right: "16px",
          zIndex: 99,
        }} className="md:hidden">
          <ProductActions
            product={product}
            isAuthenticated={isAuthenticated}
            currentStock={currentStock}
            remainingAllowed={remainingAllowed}
            handleAddToCart={handleAddToCart}
            isInWishlist={isInWishlist}
            toggleWishlist={toggleWishlist}
            wishlistAnimating={wishlistAnimating}
            setWishlistAnimating={setWishlistAnimating}
            showNotifyModal={showNotifyModal}
            user={user}
            router={router}
            isItemInCart={isItemInCart}
            handleGoToCart={handleGoToCart}
          />
        </div>
      )}
          </div>

          {/* Trust Signals */}
          <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { icon: <Truck size={18} />, text: "Free shipping on orders over ₹100" },
              { icon: <Shield size={18} />, text: "2-year manufacturer warranty" },
              { icon: <RotateCcw size={18} />, text: "30-day hassle-free returns" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                {item.icon}
                {item.text}
              </div>
            ))}
          </div>

          {/* Tabs for Details and Specs */}
          <div style={{ marginTop: "32px", borderTop: "1px solid var(--color-border-light)", paddingTop: "24px" }}>
            <div style={{ display: "flex", gap: "24px", marginBottom: "20px", borderBottom: "1px solid var(--color-border-light)" }}>
              <button 
                onClick={() => setActiveTab('details')}
                style={{ 
                  fontFamily: "var(--font-heading)", 
                  fontSize: "12px", 
                  letterSpacing: "0.15em", 
                  paddingBottom: "12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: activeTab === 'details' ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  borderBottom: activeTab === 'details' ? "2px solid var(--color-text-primary)" : "2px solid transparent",
                }}
              >
                DETAILS
              </button>
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <button 
                  onClick={() => setActiveTab('specifications')}
                  style={{ 
                    fontFamily: "var(--font-heading)", 
                    fontSize: "12px", 
                    letterSpacing: "0.15em", 
                    paddingBottom: "12px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: activeTab === 'specifications' ? "var(--color-text-primary)" : "var(--color-text-muted)",
                    borderBottom: activeTab === 'specifications' ? "2px solid var(--color-text-primary)" : "2px solid transparent",
                  }}
                >
                  SPECIFICATIONS
                </button>
              )}
            </div>

            {activeTab === 'details' && (
              <div>
                <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--color-text-secondary)" }}>
                  {product.description}
                </p>
                {product.features && product.features.length > 0 && (
                  <ul style={{ marginTop: "16px", paddingLeft: "20px", fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6, listStyleType: "disc" }}>
                    {product.features.map((feature, i) => (
                      <li key={i} style={{ marginBottom: "4px" }}>{feature}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'specifications' && product.specifications && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{key}</span>
                    <span style={{ fontSize: "14px", color: "var(--color-text-primary)" }}>{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {reviews.length != 0&&
      <section style={{ marginTop: "64px", marginBottom: "64px" }}>
        <h2 style={{ fontSize: "clamp(16px, 2vw, 22px)", letterSpacing: "0.06em", marginBottom: "32px", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "16px" }}>
          CUSTOMER REVIEWS
        </h2>
        {reviews.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--color-text-muted)" }}>
            <MessageCircle size={48} strokeWidth={1} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {reviews.map((review) => (
              <div key={review.id} style={{ backgroundColor: "var(--color-bg-secondary)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border-light)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {review.userName || "Verified Buyer"}
                  </div>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={14} fill={review.rating >= star ? "#ff3f6c" : "transparent"} color={review.rating >= star ? "#ff3f6c" : "#e5e7eb"} />
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "12px" }}>
                  {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
                <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--color-text-secondary)" }}>
                  {review.comment}
                </p>
                {review.images && review.images.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                    {review.images.map((img: string, idx: number) => (
                      <div key={idx} style={{ width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--color-border-light)" }}>
                        <img src={img} alt="Review attachment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>}

      {/* Related Products */}
      {related.length > 0 && (
        <section>
          <h2 style={{ fontSize: "clamp(16px, 2vw, 22px)", letterSpacing: "0.06em", marginBottom: "32px" }}>
            YOU MAY ALSO LIKE
          </h2>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

     
    </div>
  );
}
