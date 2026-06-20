export interface User {
  id: number;
  username: string;
  email: string;
  role: 'consumer' | 'admin';
  full_name?: string;
  profile_picture_url?: string;
  auth_provider?: 'email' | 'google';
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string | number;
  sale_price: string | number | null;
  stock: number;
  category_id: number | null;
  category_name?: string;
  image_url: string;
  created_at: string;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  name: string;
  price: string | number;
  sale_price: string | number | null;
  image_url: string;
  stock: number;
}

export interface BillingAddress {
  id?: number;
  user_id?: number;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_percent: number;
  is_active: boolean | number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: string | number;
  name: string;
  image_url: string;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: string | number;
  payment_method: string;
  status: string;
  created_at: string;
  username?: string;
  email?: string;
  billing_address?: BillingAddress | null;
  items?: OrderItem[];
}
