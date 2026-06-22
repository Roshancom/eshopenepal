/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth, CartProvider } from "@eshopnepal/shared";
import type { Product, Category, Coupon, Order } from "@eshopnepal/shared";
import {
  authApi,
  productsApi,
  categoryApi,
  couponsApi,
  ordersApi,
  customerApi,
  paymentsApi,
} from "@eshopnepal/shared";
import { AdminSidebar } from "./components/AdminSidebar";
import { AdminOrdersView } from "./components/AdminOrdersView";
import { AdminReportsView } from "./components/AdminReportsView";
import { AdminLogin } from "./components/AdminLogin";
import { AdminRegister } from "./components/AdminRegister";
import { AdminProductsView } from "./components/AdminProductsView";
import { AdminAddProductView } from "./components/AdminAddProductView";
import { AdminCategoriesView } from "./components/AdminCategoriesView";
import { AdminCouponsView } from "./components/AdminCouponsView";
import { AdminPaymentsView } from "./components/AdminPaymentsView";
import { AdminCustomersView } from "./components/AdminCustomersView";
import { AdminOrderDetailView } from "./components/AdminOrderDetailView";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AlertCircle, CheckCircle } from "lucide-react";

function AppContent({ hasGoogleOAuth }: { hasGoogleOAuth: boolean }) {
  const { user, loading: authLoading, setUser } = useAuth();

  const [currentPath, setCurrentPath] = useState<string>("/admin/dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [customersLoading, setCustomersLoading] = useState<boolean>(false);
  const [stripeConfig, setStripeConfig] = useState<{
    stripeEnabled: boolean;
    publicKey: string | null;
  }>({ stripeEnabled: false, publicKey: null });

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerErrors, setRegisterErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [couponForm, setCouponForm] = useState({
    code: "",
    discount_percent: 10,
  });
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    sale_price: "",
    stock: "5",
    category_id: "",
    image_url: "",
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Hash-based router
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1) || "/admin/dashboard";
      if (hash.startsWith("/admin/orders/")) {
        const idStr = hash.split("/")[3];
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) {
          setSelectedOrderId(id);
          setCurrentPath("/admin/orders/:id");
          return;
        }
      }
      setCurrentPath(hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const triggerToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Load data
  useEffect(() => {
    const loadProductsAndCategories = async () => {
      setProductsLoading(true);
      try {
        const cData = await categoryApi.getAll();
        setCategories(cData);
        const pData = await productsApi.getAll();
        setProducts(pData);
      } catch (err) {
        console.error(err);
      } finally {
        setProductsLoading(false);
      }
    };
    loadProductsAndCategories();
  }, [currentPath]);

  useEffect(() => {
    if (user && user.role === "admin") {
      const loadAdminData = async () => {
        setCustomersLoading(true);
        try {
          const cust = await customerApi.getAll();
          setCustomers(cust);
          const coup = await couponsApi.getAll();
          setCoupons(coup);
          const pay = await paymentsApi.getConfig();
          setStripeConfig(pay);
        } catch (err) {
          console.error(err);
        } finally {
          setCustomersLoading(false);
        }
      };
      loadAdminData();
    }
  }, [user, currentPath]);

  // Password strength helper
  const getPasswordStrength = (
    pw: string,
  ): { score: number; label: string; color: string } => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score <= 2) return { score: 2, label: "Fair", color: "bg-orange-400" };
    if (score <= 3) return { score: 3, label: "Good", color: "bg-amber-400" };
    return { score: 4, label: "Strong", color: "bg-emerald-500" };
  };

  const passwordStrength = registerForm.password
    ? getPasswordStrength(registerForm.password)
    : null;

  // Auth handlers
  const validateRegisterForm = () => {
    const errors: typeof registerErrors = {};
    if (!registerForm.username.trim()) {
      errors.username = "Username is required.";
    } else if (registerForm.username.trim().length < 2) {
      errors.username = "Username must be at least 2 characters.";
    }
    if (!registerForm.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!registerForm.password) {
      errors.password = "Password is required.";
    } else if (registerForm.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (registerForm.password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;
    setFormSubmitting(true);
    try {
      const data = await authApi.registerAdmin(registerForm);
      setUser(data.user);
      triggerToast(
        "success",
        `Welcome, ${data.user.username}! Account created.`,
      );
      setRegisterForm({ username: "", email: "", password: "" });
      setConfirmPassword("");
      setRegisterErrors({});
      navigate("/admin/dashboard");
    } catch (err: any) {
      triggerToast(
        "error",
        err.response?.data?.error || "Registration failed.",
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const data = await authApi.adminLogin(loginForm);
      setUser(data.user);
      triggerToast("success", `Welcome back, ${data.user.username}!`);
      setLoginForm({ email: "", password: "" });
      navigate("/admin/dashboard");
    } catch (err: any) {
      triggerToast(
        "error",
        err.response?.data?.error || "Authentication failed.",
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Admin: Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await categoryApi.create(categoryForm.name);
      setCategoryForm({ name: "" });
      const c = await categoryApi.getAll();
      setCategories(c);
      triggerToast("success", "Category created successfully.");
    } catch (err: any) {
      triggerToast(
        "error",
        err.response?.data?.error || "Failed to create category.",
      );
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await categoryApi.delete(id);
      const c = await categoryApi.getAll();
      setCategories(c);
      triggerToast("success", "Category deleted.");
    } catch (err: any) {
      triggerToast(
        "error",
        err.response?.data?.error || "Failed to delete category.",
      );
    }
  };

  // Admin: Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await couponsApi.create(couponForm);
      setCouponForm({ code: "", discount_percent: 10 });
      const cp = await couponsApi.getAll();
      setCoupons(cp);
      triggerToast("success", "Coupon created.");
    } catch (err: any) {
      triggerToast(
        "error",
        err.response?.data?.error || "Failed to create coupon.",
      );
    }
  };

  const handleToggleCoupon = async (id: number, currentActive: boolean) => {
    try {
      await couponsApi.toggle(id, !currentActive);
      const cp = await couponsApi.getAll();
      setCoupons(cp);
      triggerToast("success", "Coupon toggled.");
    } catch {
      triggerToast("error", "Failed to toggle coupon.");
    }
  };

  // Admin: Product
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", productForm.name);
      formData.append("description", productForm.description);
      formData.append("price", productForm.price);
      formData.append("sale_price", productForm.sale_price);
      formData.append("stock", productForm.stock);
      formData.append("category_id", productForm.category_id);
      formData.append("image_url", productForm.image_url);
      if (productImageFile) formData.append("image", productImageFile);
      await productsApi.create(formData);
      triggerToast("success", "Product created.");
      setProductForm({
        name: "",
        description: "",
        price: "",
        sale_price: "",
        stock: "5",
        category_id: "",
        image_url: "",
      });
      setProductImageFile(null);
      navigate("/admin/products");
    } catch (err: any) {
      triggerToast(
        "error",
        err.response?.data?.error || "Failed to create product.",
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await productsApi.delete(id);
      const p = await productsApi.getAll();
      setProducts(p);
      triggerToast("success", "Product deleted.");
    } catch {
      triggerToast("error", "Failed to delete product.");
    }
  };

  // Order details
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeOrderLoading, setActiveOrderLoading] = useState(false);

  useEffect(() => {
    if (currentPath === "/admin/orders/:id" && selectedOrderId) {
      setActiveOrderLoading(true);
      ordersApi
        .getById(selectedOrderId)
        .then(setActiveOrder)
        .catch(console.error)
        .finally(() => setActiveOrderLoading(false));
    }
  }, [currentPath, selectedOrderId]);

  // Route guard
  useEffect(() => {
    if (authLoading) return;
    const adminPaths = [
      "/admin/dashboard",
      "/admin/products",
      "/admin/products/add",
      "/admin/categories",
      "/admin/orders",
      "/admin/orders/:id",
      "/admin/coupons",
      "/admin/customers",
      "/admin/reports",
      "/admin/payments",
    ];
    if (adminPaths.includes(currentPath)) {
      if (!user) navigate("/admin/login");
      else if (user.role !== "admin") {
        triggerToast("error", "Admin access required.");
        navigate("/admin/login");
      }
    }
  }, [currentPath, user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50/50">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-100 border-t-amber-600 mx-auto"></div>
          <p className="text-sm font-semibold text-gray-500 font-mono">
            Loading Admin Console...
          </p>
        </div>
      </div>
    );
  }

  // Admin login screen
  if (
    currentPath === "/admin/login" ||
    (!user && currentPath !== "/admin/register")
  ) {
    return (
      <>
        {toast && (
          <div className="fixed top-20 right-4 z-[9999] flex max-w-sm items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
            {toast.type === "success" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle size={18} />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <AlertCircle size={18} />
              </div>
            )}
            <p className="text-xs font-bold text-gray-800">{toast.message}</p>
          </div>
        )}
        <AdminLogin
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          onSubmit={handleLogin}
          onNavigate={navigate}
          formSubmitting={formSubmitting}
          showGoogleLogin={hasGoogleOAuth}
          onGoogleSuccess={(u) => setUser(u)}
        />
      </>
    );
  }

  // Admin register screen
  if (currentPath === "/admin/register" && !user) {
    return (
      <>
        {toast && (
          <div className="fixed top-20 right-4 z-[9999] flex max-w-sm items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
            {toast.type === "success" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle size={18} />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <AlertCircle size={18} />
              </div>
            )}
            <p className="text-xs font-bold text-gray-800">{toast.message}</p>
          </div>
        )}
        <AdminRegister
          registerForm={registerForm}
          setRegisterForm={setRegisterForm}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          registerErrors={registerErrors}
          setRegisterErrors={setRegisterErrors}
          passwordStrength={passwordStrength}
          onSubmit={handleRegister}
          onNavigate={navigate}
          formSubmitting={formSubmitting}
          showGoogleLogin={hasGoogleOAuth}
          onGoogleSuccess={(u) => setUser(u)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-800 flex flex-col font-sans">
      {toast && (
        <div className="fixed top-20 right-4 z-[9999] flex max-w-sm items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
          {toast.type === "success" ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle size={18} />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle size={18} />
            </div>
          )}
          <p className="text-xs font-bold text-gray-800">{toast.message}</p>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
          <AdminSidebar navigate={navigate} currentPath={currentPath} />

          <section className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
            {currentPath === "/admin/dashboard" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-950">
                    Dashboard
                  </h1>
                  <p className="text-xs text-gray-500">
                    Store overview and key metrics.
                  </p>
                </div>
                <AdminReportsView />
              </div>
            )}

            {currentPath === "/admin/orders" && (
              <AdminOrdersView
                navigate={navigate}
                onSuccess={(m) => triggerToast("success", m)}
                onError={(m) => triggerToast("error", m)}
              />
            )}

            {currentPath === "/admin/orders/:id" && (
              <AdminOrderDetailView
                order={activeOrder}
                loading={activeOrderLoading}
                onNavigate={navigate}
              />
            )}

            {currentPath === "/admin/products" && (
              <AdminProductsView
                products={products}
                loading={productsLoading}
                onNavigate={navigate}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {currentPath === "/admin/products/add" && (
              <AdminAddProductView
                productForm={productForm}
                setProductForm={setProductForm}
                productImageFile={productImageFile}
                setProductImageFile={setProductImageFile}
                categories={categories}
                onSubmit={handleProductSubmit}
                onNavigate={navigate}
                formSubmitting={formSubmitting}
              />
            )}

            {currentPath === "/admin/categories" && (
              <AdminCategoriesView
                categories={categories}
                categoryForm={categoryForm}
                setCategoryForm={setCategoryForm}
                onCreateCategory={handleCreateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {currentPath === "/admin/coupons" && (
              <AdminCouponsView
                coupons={coupons}
                couponForm={couponForm}
                setCouponForm={setCouponForm}
                onCreateCoupon={handleCreateCoupon}
                onToggleCoupon={handleToggleCoupon}
              />
            )}

            {currentPath === "/admin/payments" && (
              <AdminPaymentsView stripeConfig={stripeConfig} />
            )}

            {currentPath === "/admin/reports" && <AdminReportsView />}

            {currentPath === "/admin/customers" && (
              <AdminCustomersView
                customers={customers}
                loading={customersLoading}
              />
            )}
          </section>
        </div>
      </main>

      <footer className="w-full bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        <p>© 2026 eShopNepal Admin Console</p>
      </footer>
    </div>
  );
}

export default function App() {
  const rawGoogleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasGoogleOAuth = !!rawGoogleId && rawGoogleId !== 'GOCSPX-placeholder' && rawGoogleId !== '123456789-placeholder.apps.googleusercontent.com';
  const googleClientId = rawGoogleId || 'GOCSPX-placeholder';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <CartProvider>
          <AppContent hasGoogleOAuth={hasGoogleOAuth} />
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
