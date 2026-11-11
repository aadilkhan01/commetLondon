"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Folder, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [parentId, setParentId] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/categories");
      if (response.data.success) {
        const cats = response.data.data || [];
        setCategories(cats);
        // Create a flat array of categories for the drop-down selector
        const flatList: Category[] = [];
        const flatten = (items: Category[]) => {
          if (!items) return;
          items.forEach(item => {
            flatList.push(item);
            if (item.children && item.children.length > 0) {
              flatten(item.children);
            }
          });
        };
        flatten(cats);
        setFlatCategories(flatList);
      }
    } catch (err) {
      setError("Failed to fetch product categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? Sub-categories may become inaccessible.")) return;
    try {
      const response = await api.delete(`/api/v1/categories/${id}`);
      if (response.data.success) {
        fetchData();
      }
    } catch (err) {
      alert("Failed to delete category.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert("Category name is required.");
      return;
    }

    const payload = {
      name,
      description,
      image,
      parentId: parentId ? parentId : undefined
    };

    try {
      const response = await api.post("/api/v1/categories", payload);
      if (response.data.success) {
        setName("");
        setDescription("");
        setImage("");
        setParentId("");
        fetchData();
      }
    } catch (err) {
      alert("Failed to create category.");
    }
  };

  const renderCategoryNode = (cat: Category, depth = 0) => {
    return (
      <div key={cat.id}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--color-border-light)",
          backgroundColor: depth % 2 === 0 ? "white" : "var(--color-bg-cream)",
          marginLeft: `${depth * 24}px`,
          borderLeft: depth > 0 ? "2px solid var(--color-border)" : "none"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {depth > 0 ? <ChevronRight size={14} color="var(--color-text-secondary)" /> : <Folder size={16} color="var(--color-text-secondary)" />}
            <span style={{ fontWeight: depth === 0 ? 600 : 500 }}>{cat.name}</span>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
              /{cat.slug}
            </span>
          </div>
          <button
            onClick={() => handleDelete(cat.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-accent-red)",
              padding: "4px"
            }}
            aria-label="Delete Category"
          >
            <Trash2 size={16} />
          </button>
        </div>
        {cat.children && cat.children.map(child => renderCategoryNode(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "var(--font-heading)", fontSize: "14px", color: "var(--color-text-secondary)" }}>
        LOADING CATEGORY COLLECTIONS...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", margin: 0, fontWeight: 500 }}>Categories</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>
          Organize parent and child categories for catalog filtering
        </p>
      </div>

      {error && (
        <div style={{ color: "var(--color-accent-red)", padding: "20px", backgroundColor: "#FFF5F5", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Two Column Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "32px", alignItems: "start" }}>
        
        {/* Category Tree View */}
        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Folder size={18} />
            <h2 style={{ fontSize: "15px", margin: 0 }}>Category Hierarchy Tree</h2>
          </div>
          <div>
            {categories.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                No categories defined. Build your first category collection on the right!
              </div>
            ) : (
              categories.map(cat => renderCategoryNode(cat, 0))
            )}
          </div>
        </div>

        {/* Add Category Form */}
        <div className="admin-card">
          <h2 style={{ fontSize: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={18} /> Add New Category
          </h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Category Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Travel Duffels"
                className="input-admin"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Parent Collection</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="input-admin"
              >
                <option value="">None (Top-Level Category)</option>
                {flatCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short collection description..."
                className="input-admin"
                style={{ height: "60px", resize: "none" }}
              />
            </div>

            <div>
              <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Image URL</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/images/categories/duffels.jpg"
                className="input-admin"
              />
            </div>

            <button type="submit" className="btn-admin-primary" style={{ marginTop: "8px" }}>
              Add Category
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
