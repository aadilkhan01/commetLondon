import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CartItem, Address } from '@/types';
import api from '@/lib/api';

// ─── Auth Store ─────────────────────────────────────────────

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, isAuthenticated: true });
      },
      updateUser: (updatedFields) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updatedFields } });
        }
      },
      logout: () => {
        localStorage.clear();
        set({ user: null, accessToken: null, isAuthenticated: false });
        useCartStore.getState().clearCart();
        useWishlistStore.getState().clearWishlist();
        useAddressStore.getState().clearAddresses();
      },
    }),
    { name: 'auth-storage' }
  )
);

// ─── Cart Store ─────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string) => void;
  toggleSelectItem: (productId: string, color?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
  syncGuestCartToServer: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setItems: (items) => set({ items: items.map((i) => ({ ...i, selected: i.selected ?? true })) }),
      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === item.productId && (i.color || "") === (item.color || ""));
        if (existing) {
          const newQuantity = Math.min(existing.quantity + item.quantity, 3);
          set({
            items: items.map((i) =>
              i.productId === item.productId && (i.color || "") === (item.color || "")
                ? { ...i, quantity: newQuantity, selected: true }
                : i
            ),
          });
          if (useAuthStore.getState().isAuthenticated) {
            api.put(`/api/v1/cart/items/${item.productId}?color=${item.color || ""}`, { quantity: newQuantity }).catch(() => {});
          }
        } else {
          set({ items: [...items, { ...item, selected: true }] });
          if (useAuthStore.getState().isAuthenticated) {
            api.post("/api/v1/cart/items", {
              productId: item.productId,
              name: item.name,
              slug: item.slug,
              image: item.image,
              price: item.price,
              quantity: item.quantity,
              color: item.color || "",
            }).catch(() => {});
          }
        }
      },
      removeItem: (productId, color) => {
        set({ items: get().items.filter((i) => !(i.productId === productId && (i.color || "") === (color || ""))) });
        if (useAuthStore.getState().isAuthenticated) {
          api.delete(`/api/v1/cart/items/${productId}?color=${color || ""}`).catch(() => {});
        }
      },
      updateQuantity: (productId, quantity, color) => {
        if (quantity <= 0) {
          get().removeItem(productId, color);
          return;
        }
        const finalQuantity = Math.min(quantity, 3);
        set({
          items: get().items.map((i) =>
            i.productId === productId && (i.color || "") === (color || "") ? { ...i, quantity: finalQuantity } : i
          ),
        });
        if (useAuthStore.getState().isAuthenticated) {
          api.put(`/api/v1/cart/items/${productId}?color=${color || ""}`, { quantity: finalQuantity }).catch(() => {});
        }
      },
      toggleSelectItem: (productId, color) => {
        set({
          items: get().items.map((i) =>
            i.productId === productId && (i.color || "") === (color || "") ? { ...i, selected: i.selected === false ? true : false } : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      getSubtotal: () => get().items.filter((i) => i.selected).reduce((sum, i) => sum + i.price * i.quantity, 0),
      getItemCount: () => get().items.filter((i) => i.selected).length,
      // Sync locally-stored guest cart items to the server after login
      syncGuestCartToServer: async () => {
        const items = get().items;
        if (items.length === 0) return;
        await Promise.allSettled(
          items.map((item) =>
            api.post("/api/v1/cart/items", {
              productId: item.productId,
              name: item.name,
              slug: item.slug,
              image: item.image,
              price: item.price,
              quantity: item.quantity,
              color: item.color || "",
            })
          )
        );
      },
    }),
    {
      name: 'guest-cart-storage',
      // Only persist items; exclude transient UI state like isOpen
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// ─── UI Store ───────────────────────────────────────────────

interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleSearch: () => void;
  closeSearch: () => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  toggleMobileMenu: () => set({ isMobileMenuOpen: !get().isMobileMenuOpen }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleSearch: () => set({ isSearchOpen: !get().isSearchOpen }),
  closeSearch: () => set({ isSearchOpen: false }),
}));

// ─── Wishlist Store ─────────────────────────────────────────

interface WishlistState {
  items: string[];
  isLoaded: boolean;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  syncGuestWishlistToServer: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoaded: false,
      fetchWishlist: async () => {
        try {
          const res = await api.get('/api/v1/users/wishlist');
          if (res.data.success) {
            const fetchedItems = res.data.data || [];
            // Reverse the array so the most recently added items appear at the top
            set({ items: fetchedItems.reverse(), isLoaded: true });
          }
        } catch {
          set({ isLoaded: true });
        }
      },
      addToWishlist: async (productId) => {
        const prev = get().items;
        // Optimistic local update: prepend to top of list
        set({ items: [productId, ...prev] });
        // Only call API if authenticated
        if (useAuthStore.getState().isAuthenticated) {
          try {
            await api.post(`/api/v1/users/wishlist/${productId}`);
          } catch {
            set({ items: prev });
          }
        }
      },
      removeFromWishlist: async (productId) => {
        const prev = get().items;
        // Optimistic local update (works for guests too)
        set({ items: prev.filter((id) => id !== productId) });
        // Only call API if authenticated
        if (useAuthStore.getState().isAuthenticated) {
          try {
            await api.delete(`/api/v1/users/wishlist/${productId}`);
          } catch {
            set({ items: prev });
          }
        }
      },
      toggleWishlist: async (productId) => {
        if (get().isInWishlist(productId)) {
          await get().removeFromWishlist(productId);
        } else {
          await get().addToWishlist(productId);
        }
      },
      isInWishlist: (productId) => get().items.includes(productId),
      clearWishlist: () => set({ items: [], isLoaded: false }),
      // Sync locally-stored guest wishlist items to the server after login
      syncGuestWishlistToServer: async () => {
        const items = get().items;
        if (items.length === 0) return;
        await Promise.allSettled(
          items.map((productId) => api.post(`/api/v1/users/wishlist/${productId}`))
        );
      },
    }),
    { name: 'wishlist-storage' }
  )
);

// ─── Address Store ──────────────────────────────────────────

interface AddressState {
  addresses: Address[];
  isLoaded: boolean;
  fetchAddresses: () => Promise<void>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<Address | null>;
  updateAddress: (id: string, address: Omit<Address, 'id'>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  clearAddresses: () => void;
}

export const useAddressStore = create<AddressState>()((set, get) => ({
  addresses: [],
  isLoaded: false,
  fetchAddresses: async () => {
    try {
      const res = await api.get('/api/v1/users/addresses');
      if (res.data.success) {
        set({ addresses: res.data.data || [], isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },
  addAddress: async (address) => {
    try {
      const res = await api.post('/api/v1/users/addresses', address);
      if (res.data.success) {
        const newAddr = res.data.data;
        set({ addresses: [...get().addresses, newAddr] });
        return newAddr;
      }
    } catch {}
    return null;
  },
  updateAddress: async (id, address) => {
    try {
      await api.put(`/api/v1/users/addresses/${id}`, address);
      set({
        addresses: get().addresses.map((a) =>
          a.id === id ? { ...a, ...address, id } : a
        ),
      });
    } catch {}
  },
  deleteAddress: async (id) => {
    const prev = get().addresses;
    set({ addresses: prev.filter((a) => a.id !== id) });
    try {
      await api.delete(`/api/v1/users/addresses/${id}`);
    } catch {
      set({ addresses: prev });
    }
  },
  clearAddresses: () => set({ addresses: [], isLoaded: false }),
}));
