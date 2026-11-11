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
  subCategory?: string;
  description: string;
  summary?: string;
  specifications?: Record<string, string>;
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

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

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

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  lowStockCount: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    email: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
}

export interface AdminSettings {
  id?: string;
  taxRate: number;
  shippingFee: number;
  freeShippingMin: number;
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}
