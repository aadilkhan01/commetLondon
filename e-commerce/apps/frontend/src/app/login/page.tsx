"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore, useCartStore, useWishlistStore } from "@/store";
import api from "@/lib/api";
import { useGoogleLogin } from "@react-oauth/google";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  // After login: sync guest cart/wishlist to server, re-fetch server cart, then redirect
  const afterLogin = async () => {
    // 1. Push all locally-stored guest items to the server DB
    await Promise.allSettled([
      useCartStore.getState().syncGuestCartToServer(),
      useWishlistStore.getState().syncGuestWishlistToServer(),
    ]);
    // 2. Re-fetch the server cart so local state reflects the freshly synced items
    //    (prevents the CartDrawer GET from overwriting local state with stale data)
    try {
      const res = await api.get("/api/v1/cart");
      if (res.data.success && res.data.data?.cart?.items) {
        useCartStore.getState().setItems(res.data.data.cart.items);
      }
    } catch {}
    router.push(redirectTo);
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setLoading(true);
      try {
        const res = await api.post("/api/v1/auth/google", { token: tokenResponse.access_token });
        if (res.data.success) {
          setAuth(res.data.data.user, res.data.data.accessToken, res.data.data.refreshToken);
          await afterLogin();
        }
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
        setError(axiosErr.response?.data?.error?.message || "Google login failed");
      }
      setLoading(false);
    },
    onError: () => {
      setError("Google Login failed or was cancelled.");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/v1/auth/login", { email, password });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.accessToken, res.data.data.refreshToken);
        await afterLogin();
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr.response?.data?.error?.message || "Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "calc(100vh - 200px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "0.06em", textAlign: "center", marginBottom: "8px" }}>
          LOGIN
        </h1>
        <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "40px" }}>
          Welcome back to GoCarry
        </p>

        {error && (
          <div style={{ padding: "12px 16px", backgroundColor: "rgba(199, 80, 80, 0.1)", color: "var(--color-accent-red)", fontSize: "13px", marginBottom: "24px", borderLeft: "3px solid var(--color-accent-red)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid var(--color-border)",
                fontSize: "14px",
                fontFamily: "var(--font-body)",
                outline: "none",
                backgroundColor: "transparent",
              }}
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>
              PASSWORD
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  padding: "14px 48px 14px 16px",
                  border: "1px solid var(--color-border)",
                  fontSize: "14px",
                  fontFamily: "var(--font-body)",
                  outline: "none",
                  backgroundColor: "transparent",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }}></div>
          <span style={{ padding: "0 16px", fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "var(--font-heading)", letterSpacing: "0.05em" }}>OR</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }}></div>
        </div>

        <button 
          onClick={() => handleGoogleLogin()}
          type="button"
          disabled={loading} 
          style={{ 
            width: "100%", padding: "14px", backgroundColor: "#FFFFFF", border: "1px solid var(--color-border)", 
            borderRadius: "4px", fontSize: "14px", fontFamily: "var(--font-heading)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
            transition: "all 0.2s ease", opacity: loading ? 0.7 : 1, color: "#1A1A1A"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
            Don&apos;t have an account?{" "}
            <Link href={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`} style={{ color: "var(--color-text-primary)", fontWeight: 500, textDecoration: "underline" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "calc(100vh - 200px)", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
