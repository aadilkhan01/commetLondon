"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useAuthStore } from "@/store";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated && user?.role === "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/v1/auth/login", { email, password });
      const data = response.data;

      if (data.success) {
        const loggedUser = data.data.user;
        if (loggedUser.role !== "ADMIN") {
          setError("Access Denied: Administrator role required.");
          setLoading(false);
          return;
        }

        setAuth(loggedUser, data.data.accessToken, data.data.refreshToken);
        router.push("/");
      } else {
        setError(data.error?.message || "Invalid credentials.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "var(--color-bg-primary)",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "440px",
        backgroundColor: "var(--color-bg-white)",
        border: "1px solid var(--color-border-light)",
        padding: "40px 32px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)"
      }}>
        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            backgroundColor: "var(--color-bg-dark)",
            color: "var(--color-text-inverse)",
            borderRadius: "50%",
            marginBottom: "16px"
          }}>
            <Shield size={24} />
          </div>
          <h1 style={{
            fontSize: "20px",
            letterSpacing: "0.15em",
            margin: 0,
            fontWeight: 500
          }}>GoCarry BACKOFFICE</h1>
          <p style={{
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            marginTop: "6px"
          }}>Sign in to manage inventory and orders</p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: "12px 16px",
            backgroundColor: "#FDF2F2",
            border: "1px solid #F8B4B4",
            color: "var(--color-accent-red)",
            fontSize: "13px",
            marginBottom: "24px"
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{
              display: "block",
              fontFamily: "var(--font-heading)",
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "8px",
              color: "var(--color-text-secondary)"
            }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gocarry.com"
              className="input-admin"
              required
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontFamily: "var(--font-heading)",
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "8px",
              color: "var(--color-text-secondary)"
            }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-admin"
                style={{ paddingRight: "44px" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)"
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-admin-primary"
            style={{
              padding: "14px",
              fontSize: "12px",
              letterSpacing: "0.15em",
              marginTop: "12px"
            }}
          >
            {loading ? "AUTHENTICATING..." : "SIGN IN TO PORTAL"}
          </button>
        </form>
      </div>
    </div>
  );
}
