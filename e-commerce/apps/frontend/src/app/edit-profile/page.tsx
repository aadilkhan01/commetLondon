"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store";
import api from "@/lib/api";

export default function EditProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", mobile: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login?redirect=/edit-profile");
    } else if (mounted && user) {
      setEditForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        mobile: user.mobile || "",
      });
    }
  }, [isAuthenticated, mounted, router, user]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess(false);
    try {
      const res = await api.put("/api/v1/users/profile", editForm);
      if (res.data.success) {
        updateUser({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          mobile: editForm.mobile,
        });
        setEditSuccess(true);
        setTimeout(() => setEditSuccess(false), 3000);
      }
    } catch {}
    setEditLoading(false);
  };

  const isEditFormUnchanged = Boolean(
    user && 
    editForm.firstName === (user.firstName || "") && 
    editForm.lastName === (user.lastName || "") && 
    editForm.mobile === (user.mobile || "")
  );

  if (!mounted || !isAuthenticated) return null;

  const inputStyle = {
    width: "100%", padding: "14px 16px", border: "1px solid var(--color-border)",
    fontSize: "14px", fontFamily: "var(--font-body)", outline: "none", backgroundColor: "transparent",
  };

  const labelStyle = {
    display: "block" as const, fontFamily: "var(--font-heading)", fontSize: "11px",
    letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: "8px",
  };

  return (
    <div className="container-main" style={{ paddingTop: "20px", paddingBottom: "80px", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(16px, 4vw, 16px)", letterSpacing: "0.15em", margin: 0 }}>
          EDIT PROFILE
        </h2>
      </div>
      <form onSubmit={handleEditSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%", background: "var(--color-bg-dark)",
              color: "white", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-heading)", fontSize: "22px", letterSpacing: "0.05em", flexShrink: 0,
            }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "2px" }}>{user?.firstName} {user?.lastName}</p>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{user?.email}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>FIRST NAME</label>
              <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} placeholder="First Name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>LAST NAME</label>
              <input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} placeholder="Last Name" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>MOBILE</label>
            <input value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} placeholder="+1 (555) 123-4567" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>EMAIL ADDRESS</label>
            <input value={user?.email || ""} disabled style={{ ...inputStyle, backgroundColor: "var(--color-bg-cream)", color: "var(--color-text-muted)", cursor: "not-allowed" }} />
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "6px" }}>Email cannot be changed</p>
          </div>

          {editSuccess && (
            <div style={{
              padding: "12px 16px", backgroundColor: "rgba(46,125,50,0.08)", color: "var(--color-accent-green)",
              fontSize: "13px", fontFamily: "var(--font-heading)", letterSpacing: "0.05em",
            }}>
              ✓ Profile updated successfully
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={editLoading || isEditFormUnchanged} style={{ alignSelf: "flex-start", opacity: editLoading || isEditFormUnchanged ? 0.7 : 1, cursor: isEditFormUnchanged ? 'not-allowed' : 'pointer' }}>
            {editLoading ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      </form>
    </div>
  );
}
