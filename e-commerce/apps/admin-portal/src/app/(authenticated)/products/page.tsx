"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import type { Product, Category, ProductVariant } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [brand, setBrand] = useState("GoCarry");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [images, setImages] = useState("");
  const [features, setFeatures] = useState("");
  const [tags, setTags] = useState("");
  const [colors, setColors] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Specifications state
  const [specMaterial, setSpecMaterial] = useState("");
  const [specDimensions, setSpecDimensions] = useState("");
  const [specWeight, setSpecWeight] = useState("");
  const [specCapacity, setSpecCapacity] = useState("");

  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Synchronize variants array whenever colors or default SKU/Price change
  useEffect(() => {
    const colorList = colors ? colors.split(",").map(c => c.trim()).filter(Boolean) : [];
    if (colorList.length === 0) {
      setVariants([]);
      return;
    }

    setVariants(prev => {
      return colorList.map((color, idx) => {
        const existing = prev.find(v => v.color.toLowerCase() === color.toLowerCase());
        if (existing) {
          return { ...existing, color };
        }
        return {
          id: editingProduct?.variants?.find(v => v.color.toLowerCase() === color.toLowerCase())?.id || `var-${idx}-${Date.now()}`,
          color,
          sku: `${sku || "SKU"}-${color.toUpperCase().replace(/\s+/g, "")}`,
          stock: 0,
          price: parseFloat(price) || 0,
        };
      });
    });
  }, [colors, price, sku, editingProduct]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get("/api/v1/products?limit=100"),
        api.get("/api/v1/categories")
      ]);
      
      if (prodRes.data.success) {
        setProducts(prodRes.data.data || []);
      }
      if (catRes.data.success) {
        setCategories(catRes.data.data || []);
      }
    } catch (err) {
      setError("Failed to fetch product catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName("");
    setSummary("");
    setBrand("GoCarry");
    setCategory("");
    setSubCategory("");
    setDescription("");
    setPrice("");
    setDiscountPrice("");
    setStock("");
    setSku("");
    setImages("");
    setFeatures("");
    setTags("");
    setColors("");
    setIsFeatured(false);
    setIsNewArrival(false);
    setIsBestSeller(false);
    setSpecMaterial("");
    setSpecDimensions("");
    setSpecWeight("");
    setSpecCapacity("");
    setVariants([]);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSummary(product.summary || "");
    setBrand(product.brand);
    setCategory(product.category);
    setSubCategory(product.subCategory || "");
    setDescription(product.description);
    setPrice(product.price.toString());
    setDiscountPrice(product.discountPrice ? product.discountPrice.toString() : "");
    setStock(product.stock.toString());
    setSku(product.sku);
    setImages(product.images ? product.images.join(", ") : "");
    setFeatures(product.features ? product.features.join(", ") : "");
    setTags(product.tags ? product.tags.join(", ") : "");
    setColors(product.colors ? product.colors.join(", ") : "");
    setIsFeatured(product.isFeatured);
    setIsNewArrival(product.isNewArrival);
    setIsBestSeller(product.isBestSeller);
    setSpecMaterial(product.specifications?.Material || "");
    setSpecDimensions(product.specifications?.Dimensions || "");
    setSpecWeight(product.specifications?.Weight || "");
    setSpecCapacity(product.specifications?.Capacity || "");
    setVariants(product.variants || []);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await api.delete(`/api/v1/products/${id}`);
      if (response.data.success) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (err) {
      alert("Failed to delete product.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !price || !stock || !sku) {
      alert("Please fill in all required fields.");
      return;
    }

    const finalStock = variants.length > 0
      ? variants.reduce((sum, v) => sum + v.stock, 0)
      : parseInt(stock);

    const payload = {
      name,
      summary,
      brand,
      category,
      subCategory,
      description,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      stock: finalStock,
      sku,
      images: images ? images.split(",").map(i => i.trim()) : [],
      features: features ? features.split(",").map(f => f.trim()) : [],
      tags: tags ? tags.split(",").map(t => t.trim()) : [],
      colors: colors ? colors.split(",").map(c => c.trim()) : [],
      variants,
      isFeatured,
      isNewArrival,
      isBestSeller,
      specifications: {
        Material: specMaterial,
        Dimensions: specDimensions,
        Weight: specWeight,
        Capacity: specCapacity,
      }
    };

    try {
      if (editingProduct) {
        // Update product
        const response = await api.put(`/api/v1/products/${editingProduct.id}`, payload);
        if (response.data.success) {
          fetchData();
          setIsModalOpen(false);
        }
      } else {
        // Create product
        const response = await api.post("/api/v1/products", payload);
        if (response.data.success) {
          fetchData();
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      alert("Failed to save product.");
    }
  };

  const computedTotalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  if (loading) {
    return (
      <div style={{ fontFamily: "var(--font-heading)", fontSize: "14px", color: "var(--color-text-secondary)" }}>
        LOADING PRODUCT CATALOG...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", margin: 0, fontWeight: 500 }}>Products</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>
            Add, update, and manage products inside the catalog database
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-admin-primary">
          <Plus size={16} /> Create Product
        </button>
      </div>

      {error && (
        <div style={{ color: "var(--color-accent-red)", padding: "20px", backgroundColor: "#FFF5F5", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="admin-card">
        <div style={{ overflowX: "auto" }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--color-text-secondary)" }}>
                    No products found. Add some products to the catalog!
                  </td>
                </tr>
              ) : (
                (products || []).map((product) => (
                  <tr key={product?.id || product?.name}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "40px",
                          height: "50px",
                          backgroundColor: "var(--color-bg-cream)",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          {product.images && product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <AlertCircle size={16} color="var(--color-text-muted)" />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{product.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{product.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "var(--font-heading)" }}>{product.sku}</td>
                    <td>{product.category} {product.subCategory && ` / ${product.subCategory}`}</td>
                    <td style={{ fontFamily: "var(--font-heading)", fontWeight: 500 }}>
                      ${(product.price || 0).toFixed(2)}
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: product.stock === 0 ? "var(--color-accent-red)" : product.stock < 5 ? "#E65100" : "inherit"
                      }}>
                        {product.stock}
                      </span>
                      {product.variants && product.variants.length > 0 && (
                        <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                          {product.variants.map((v) => (
                            <div key={v.color} style={{ whiteSpace: "nowrap" }}>
                              {v.color}: <span style={{ fontWeight: 500, color: v.stock === 0 ? "var(--color-accent-red)" : "inherit" }}>{v.stock}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button onClick={() => openEditModal(product)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }} aria-label="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-accent-red)" }} aria-label="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white",
            width: "100%",
            maxWidth: "760px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "32px",
            position: "relative"
          }}>
            <button onClick={() => setIsModalOpen(false)} style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)"
            }}>
              <X size={20} />
            </button>

            <h2 style={{ fontSize: "20px", marginBottom: "24px" }}>
              {editingProduct ? "Edit Product" : "Create Product"}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                <div>
                  <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Product Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-admin" required />
                </div>
                <div>
                  <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Summary</label>
                  <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)} className="input-admin" placeholder="e.g. cabin spinner 24'" />
                </div>
                <div>
                  <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">SKU Code *</label>
                  <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="input-admin" required />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Category *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-admin" required>
                    <option value="">Select Category</option>
                    {(categories || []).map(c => (
                      <option key={c?.id || c?.name} value={c?.name || ""}>{c?.name || ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Sub Category</label>
                  <input type="text" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="input-admin" placeholder="e.g. Trolley Bags" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                <div>
                  <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Price ($) *</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input-admin" required />
                </div>
                <div>
                  <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Discount Price ($)</label>
                  <input type="number" step="0.01" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="input-admin" />
                </div>
                <div>
                  <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">
                    Total Stock Count {variants.length === 0 && "*"}
                  </label>
                  <input
                    type="number"
                    value={variants.length > 0 ? computedTotalStock.toString() : stock}
                    onChange={(e) => {
                      if (variants.length === 0) setStock(e.target.value);
                    }}
                    className="input-admin"
                    disabled={variants.length > 0}
                    style={variants.length > 0 ? { backgroundColor: "#F3F4F6", cursor: "not-allowed" } : undefined}
                    required={variants.length === 0}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-admin" style={{ height: "80px", resize: "none" }} />
              </div>

              <div>
                <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Image URLs (comma-separated)</label>
                <input type="text" value={images} onChange={(e) => setImages(e.target.value)} className="input-admin" placeholder="/images/products/bag-1.jpg, /images/products/bag-2.jpg" />
              </div>

               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                <div>
                  <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Features (comma-separated)</label>
                  <input type="text" value={features} onChange={(e) => setFeatures(e.target.value)} className="input-admin" placeholder="Feature 1, Feature 2" />
                </div>
                <div>
                  <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Tags (comma-separated)</label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="input-admin" placeholder="travel, lightweight" />
                </div>
                <div>
                  <label className="text-[11px] font-heading tracking-widest text-slate-500 uppercase block mb-1">Colors (comma-separated)</label>
                  <input type="text" value={colors} onChange={(e) => setColors(e.target.value)} className="input-admin" placeholder="Black, Navy, Sage" />
                </div>
              </div>

              {/* Technical Specifications */}
              <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: "16px" }}>
                <h3 style={{ fontSize: "12px", marginBottom: "12px" }}>Technical Specifications</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="text-[9px] font-heading text-slate-500 uppercase block mb-1">Material</label>
                    <input type="text" value={specMaterial} onChange={(e) => setSpecMaterial(e.target.value)} className="input-admin" placeholder="Polycarbonate" />
                  </div>
                  <div>
                    <label className="text-[9px] font-heading text-slate-500 uppercase block mb-1">Dimensions</label>
                    <input type="text" value={specDimensions} onChange={(e) => setSpecDimensions(e.target.value)} className="input-admin" placeholder="20 x 14 x 9" />
                  </div>
                  <div>
                    <label className="text-[9px] font-heading text-slate-500 uppercase block mb-1">Weight</label>
                    <input type="text" value={specWeight} onChange={(e) => setSpecWeight(e.target.value)} className="input-admin" placeholder="6.5 lbs" />
                  </div>
                  <div>
                    <label className="text-[9px] font-heading text-slate-500 uppercase block mb-1">Capacity</label>
                    <input type="text" value={specCapacity} onChange={(e) => setSpecCapacity(e.target.value)} className="input-admin" placeholder="38L" />
                  </div>
                </div>
              </div>

              {/* Variant Stock & Price Builder */}
              {variants.length > 0 && (
                <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: "16px" }}>
                  <h3 style={{ fontSize: "12px", marginBottom: "12px" }}>Variant Stock & Price Configuration</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {variants.map((v, idx) => (
                      <div key={v.color} style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 1fr 1.2fr 1.2fr", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{v.color}</span>
                        <div>
                          <label className="text-[9px] font-heading text-slate-500 uppercase block mb-1">Variant SKU</label>
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].sku = e.target.value;
                              setVariants(updated);
                            }}
                            className="input-admin"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-heading text-slate-500 uppercase block mb-1">Stock</label>
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].stock = parseInt(e.target.value) || 0;
                              setVariants(updated);
                            }}
                            className="input-admin"
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-heading text-slate-500 uppercase block mb-1">Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={v.price}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].price = parseFloat(e.target.value) || 0;
                              setVariants(updated);
                            }}
                            className="input-admin"
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-heading text-slate-500 uppercase block mb-1">Discount Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={v.discountPrice !== undefined ? v.discountPrice : ""}
                            onChange={(e) => {
                              const updated = [...variants];
                              const val = e.target.value;
                              updated[idx].discountPrice = val ? parseFloat(val) : undefined;
                              setVariants(updated);
                            }}
                            className="input-admin"
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promotion Badges checkboxes */}
              <div style={{ display: "flex", gap: "24px", borderTop: "1px solid var(--color-border-light)", paddingTop: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                  <span>Featured Product</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} />
                  <span>New Arrival</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} />
                  <span>Best Seller</span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-admin-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
