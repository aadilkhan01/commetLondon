"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";

  return (
    <div className="container-main" style={{ paddingTop: "80px", paddingBottom: "120px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
      <CheckCircle size={64} strokeWidth={1} style={{ color: "var(--color-accent-green)", margin: "0 auto 24px" }} />

      <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "0.06em", marginBottom: "16px" }}>
        ORDER CONFIRMED
      </h1>

      <p style={{ color: "var(--color-text-secondary)", fontSize: "16px", lineHeight: 1.7, marginBottom: "12px" }}>
        Thank you for your purchase! Your order has been placed successfully.
      </p>

      {orderNumber && (
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "14px", letterSpacing: "0.1em", marginBottom: "40px" }}>
          ORDER #{orderNumber}
        </p>
      )}

      <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/profile" className="btn-primary">VIEW ORDERS</Link>
        <Link href="/shop" className="btn-outline">CONTINUE SHOPPING</Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
