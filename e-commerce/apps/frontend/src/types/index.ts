// ─── Product Types ──────────────────────────────────────────

export interface ProductVariant {
  id: string;
  color: string;
  sku: string;
  stock: number;
  price: number;
  discountPrice?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  subCategory: string;
  description: string;
  summary?: string;
  specifications: Record<string, string>;
  features: string[];
  images: string[];
  price: number;
  discountPrice?: number;
  stock: number;
  sku: string;
  ratings: number;
  reviewsCount: number;
  tags: string[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  colors?: string[];
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
}

export interface ProductFilter {
  category?: string;
  subCategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  tags?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

// ─── Auth Types ─────────────────────────────────────────────

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  mobile?: string;
  profileImage?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// ─── Cart Types ─────────────────────────────────────────────

export interface CartItem {
  productId: string;
  name: string;
  slug?: string;
  image: string;
  price: number;
  quantity: number;
  stock?: number;
  selected?: boolean;
  color?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

// ─── Order Types ────────────────────────────────────────────

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Types ─────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: { code: number; message: string };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── Address Types ──────────────────────────────────────────

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

// ─── Filter Options ─────────────────────────────────────────

export interface FilterOptions {
  brands: string[];
  colors?: string[];
  categories: string[];
  minPrice: number;
  maxPrice: number;
}
