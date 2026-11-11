"use client";

import { X, Search, TrendingUp } from "lucide-react";
import { useUIStore } from "@/store";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchModal() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState("");
  const router = useRouter();

  const trending = ["Trolley Bag", "Laptop Backpack", "Cabin Luggage", "Duffel Bag", "Travel Organizer", "Premium Luggage"];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      closeSearch();
      setQuery("");
    }
  };

  const handleTrendingClick = (term: string) => {
    router.push(`/search?q=${encodeURIComponent(term)}`);
    closeSearch();
    setQuery("");
  };

  return (
    <div className={`search-overlay ${isSearchOpen ? "open" : ""}`} onClick={closeSearch}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "640px", padding: "0 20px" }}
      >
        {/* Close Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
          <button onClick={closeSearch} style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: "4px" }}>
            <X size={28} strokeWidth={1.5} />
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch}>
          <div style={{ display: "flex", alignItems: "center", borderBottom: "2px solid rgba(255,255,255,0.3)", paddingBottom: "12px" }}>
            <Search size={22} strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.6)", marginRight: "16px" }} />
            <input
              type="text"
              placeholder="Search for bags, luggage, backpacks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus={isSearchOpen}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "white",
                fontSize: "20px",
                fontFamily: "var(--font-body)",
                fontWeight: 300,
              }}
            />
          </div>
        </form>

        {/* Trending Searches */}
        <div style={{ marginTop: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <TrendingUp size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
              Trending Searches
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {trending.map((term) => (
              <button
                key={term}
                onClick={() => handleTrendingClick(term)}
                style={{
                  padding: "8px 20px",
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.8)",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
