import axios from "axios";
import type { BillingAddress } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// Auth API Calls
export const authApi = {
  async register(data: any) {
    const res = await api.post("/auth/register", data);
    return res.data;
  },
  async login(data: any) {
    const res = await api.post("/auth/login", data);
    return res.data;
  },
  async registerAdmin(data: any) {
    const res = await api.post("/auth/admin/register", data);
    return res.data;
  },
  async adminLogin(data: any) {
    const res = await api.post("/auth/admin/login", data);
    return res.data;
  },
  async getMe() {
    const res = await api.get("/auth/me");
    return res.data;
  },
  async googleLogin(token: string, role?: string) {
    const res = await api.post("/auth/google", { token, role });
    return res.data;
  },
  async logout() {
    const res = await api.post("/auth/logout");
    return res.data;
  },
};

// Products API Calls
export const productsApi = {
  async getAll(categoryId?: number) {
    const res = await api.get("/products", {
      params: categoryId ? { categoryId } : {},
    });
    return res.data;
  },
  async getById(id: number) {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },
  async create(formData: FormData) {
    const res = await api.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  async update(id: number, formData: FormData) {
    const res = await api.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  async delete(id: number) {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },
};

// Category API Calls
export const categoryApi = {
  async getAll() {
    const res = await api.get("/categories");
    return res.data;
  },
  async create(name: string) {
    const res = await api.post("/categories", { name });
    return res.data;
  },
  async delete(id: number) {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};

// Cart API Calls
export const cartApi = {
  async get() {
    const res = await api.get("/cart");
    return res.data;
  },
  async add(product_id: number, quantity: number = 1) {
    const res = await api.post("/cart/add", { product_id, quantity });
    return res.data;
  },
  async update(product_id: number, quantity: number) {
    const res = await api.put("/cart/update", { product_id, quantity });
    return res.data;
  },
  async remove(id: number) {
    const res = await api.delete(`/cart/remove/${id}`);
    return res.data;
  },
};

// Coupons API Calls
export const couponsApi = {
  async getAll() {
    const res = await api.get("/coupons");
    return res.data;
  },
  async apply(code: string) {
    const res = await api.post("/coupons/apply", { code });
    return res.data;
  },
  async create(data: {
    code: string;
    discount_percent: number;
    is_active?: boolean;
  }) {
    const res = await api.post("/coupons", data);
    return res.data;
  },
  async toggle(id: number, is_active: boolean) {
    const res = await api.put(`/coupons/${id}/toggle`, { is_active });
    return res.data;
  },
};

// Orders API Calls
export const ordersApi = {
  async place(data: { payment_method: string; coupon_code?: string }) {
    const res = await api.post("/orders/place", data);
    return res.data;
  },
  async getMyOrders() {
    const res = await api.get("/orders/my-orders");
    return res.data;
  },
  async getAll() {
    const res = await api.get("/orders");
    return res.data;
  },
  async getById(id: number) {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },
  async updateStatus(id: number, status: string) {
    const res = await api.put(`/orders/${id}/status`, { status });
    return res.data;
  },
};

// Billing API Calls
export const billingApi = {
  async get() {
    const res = await api.get("/billing");
    return res.data;
  },
  async save(address: BillingAddress) {
    const res = await api.post("/billing", address);
    return res.data;
  },
};

// Customer API Calls
export const customerApi = {
  async getAll() {
    const res = await api.get("/customers");
    return res.data;
  },
};

// Reports API Calls
export const reportApi = {
  async getSales() {
    const res = await api.get("/reports/sales");
    return res.data;
  },
  async getTopProducts() {
    const res = await api.get("/reports/top-products");
    return res.data;
  },
};

// eSewa Payments API
export const esewaApi = {
  async initiate(data: { order_id: number; total_amount: number }) {
    const res = await api.post("/esewa/initiate", data);
    return res.data;
  },
  async verify(data: {
    product_code: string;
    total_amount: number;
    transaction_uuid: string;
  }) {
    const res = await api.post("/esewa/verify", data);
    return res.data;
  },
  async cleanup(order_id: number) {
    const res = await api.post("/esewa/cleanup", { order_id });
    return res.data;
  },
};

// Payments config
export const paymentsApi = {
  async getConfig() {
    const res = await api.get("/payments/config");
    return res.data;
  },
};

export default api;
