/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, Suspense } from "react";
import {
  AuthProvider,
  useAuth,
  CartProvider,
  useCart,
} from "@eshopnepal/shared";
import type { Order, BillingAddress } from "@eshopnepal/shared";
import { authApi, ordersApi, billingApi } from "@eshopnepal/shared";
import { Navbar } from "./components/Navbar";
import { ProductsListingView } from "./components/ProductsListingView";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AlertCircle, CheckCircle } from "lucide-react";
import Homepage from "./components/HomePage";

// ── Lazy-loaded route components (code splitting) ──────────────────────
const ProductDetailView = React.lazy(() =>
  import("./components/ProductDetailView").then((m) => ({
    default: m.ProductDetailView,
  })),
);
const ConsumerDashboard = React.lazy(() =>
  import("./components/ConsumerDashboard").then((m) => ({
    default: m.ConsumerDashboard,
  })),
);
const CartView = React.lazy(() =>
  import("./components/CartView").then((m) => ({ default: m.CartView })),
);
const CheckoutView = React.lazy(() =>
  import("./components/CheckoutView").then((m) => ({
    default: m.CheckoutView,
  })),
);
const OrderConfirmationView = React.lazy(() =>
  import("./components/OrderConfirmationView").then((m) => ({
    default: m.OrderConfirmationView,
  })),
);
const LoginView = React.lazy(() =>
  import("./components/LoginView").then((m) => ({ default: m.LoginView })),
);
const RegisterView = React.lazy(() =>
  import("./components/RegisterView").then((m) => ({
    default: m.RegisterView,
  })),
);

// ── Memoized Toast component ───────────────────────────────────────────
const Toast: React.FC<{
  toast: { type: "success" | "error"; message: string } | null;
}> = React.memo(({ toast }) => {
  if (!toast) return null;
  return (
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
  );
});
Toast.displayName = "Toast";

// ── Suspense fallback ──────────────────────────────────────────────────
const PageFallback = (
  <div className="flex min-h-[400px] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
  </div>
);

// ── Main App Content ───────────────────────────────────────────────────
function AppContent({ hasGoogleOAuth }: { hasGoogleOAuth: boolean }) {
  const { user, loading: authLoading, setUser } = useAuth();
  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
    getCartTotal,
    getDiscountedTotal,
    discountPercentage,
    appliedCouponCode,
    applyCouponCode,
    clearCouponCode,
    refreshCart,
  } = useCart();

  console.log("AppContent render", { user, cartItems });

  // ── Navigation state ──
  const [currentPath, setCurrentPath] = useState<string>("/products");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // ── Checkout state ──

  // ── Toast state ──
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ── Form state ──
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [checkoutBilling, setCheckoutBilling] = useState<BillingAddress>({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "Nepal",
  });
  const [paymentMethod, setPaymentMethod] =
    useState<string>("Cash on Delivery");
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // ── Order details state ──
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeOrderLoading, setActiveOrderLoading] = useState(false);

  // ── Hash-based router ──
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1) || "/products";
      if (hash.startsWith("/products/")) {
        const idStr = hash.split("/")[2];
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) {
          setSelectedProductId(id);
          setCurrentPath("/products/:id");
          return;
        }
      }
      if (hash.startsWith("/order-confirmation/")) {
        const idStr = hash.split("/")[2];
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) {
          setSelectedOrderId(id);
          setCurrentPath("/order-confirmation");
          return;
        }
      }
      setCurrentPath(hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // ── Memoized callbacks ──
  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  const triggerToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 4500);
    },
    [],
  );

  const handleAddToCart = useCallback(
    (productId: number, name: string) => {
      addToCart(productId, 1).then((err) => {
        if (err) triggerToast("error", err);
        else triggerToast("success", `Added ${name} to cart.`);
      });
    },
    [addToCart, triggerToast],
  );

  // ── Load billing + stripe config ──
  useEffect(() => {
    if (user && currentPath === "/checkout") {
      billingApi
        .get()
        .then((d) => {
          if (d) setCheckoutBilling(d);
        })
        .catch(() => {});
    }
  }, [user, currentPath]);

  // ── Auth handlers ──
  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormSubmitting(true);
      try {
        const data = await authApi.login(loginForm);
        setUser(data.user);
        triggerToast("success", `Welcome back, ${data.user.username}!`);
        setLoginForm({ email: "", password: "" });
        navigate("/products");
      } catch (err: any) {
        triggerToast(
          "error",
          err.response?.data?.error || "Authentication failed.",
        );
      } finally {
        setFormSubmitting(false);
      }
    },
    [loginForm, setUser, triggerToast, navigate],
  );

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormSubmitting(true);
      try {
        const data = await authApi.register(registerForm);
        setUser(data.user);
        triggerToast("success", `Account created, ${data.user.username}!`);
        setRegisterForm({ username: "", email: "", password: "" });
        navigate("/products");
      } catch (err: any) {
        triggerToast(
          "error",
          err.response?.data?.error || "Registration failed.",
        );
      } finally {
        setFormSubmitting(false);
      }
    },
    [registerForm, setUser, triggerToast, navigate],
  );

  // ── Order placement ──
  const handlePlaceOrder = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormSubmitting(true);
      try {
        await billingApi.save(checkoutBilling);
        await ordersApi.place({
          payment_method: paymentMethod,
          coupon_code: appliedCouponCode || undefined,
        });
        triggerToast("success", "Order placed successfully!");
        clearCouponCode();
        refreshCart();
        navigate("/products");
      } catch (err: any) {
        triggerToast("error", err.response?.data?.error || "Checkout failed.");
      } finally {
        setFormSubmitting(false);
      }
    },
    [
      checkoutBilling,
      paymentMethod,
      appliedCouponCode,
      clearCouponCode,
      refreshCart,
      triggerToast,
      navigate,
    ],
  );

  // ── Order details ──
  useEffect(() => {
    if (currentPath === "/order-confirmation" && selectedOrderId) {
      setActiveOrderLoading(true);
      ordersApi
        .getById(selectedOrderId)
        .then(setActiveOrder)
        .catch(console.error)
        .finally(() => setActiveOrderLoading(false));
    }
  }, [currentPath, selectedOrderId]);

  // ── Route guard ──
  useEffect(() => {
    if (authLoading) return;
    const protectedRoutes = [
      "/dashboard",
      "/cart",
      "/checkout",
      "/order-confirmation",
    ];
    if (protectedRoutes.includes(currentPath) && !user) {
      triggerToast("error", "Please log in first.");
      navigate("/login");
    }
  }, [currentPath, user, authLoading, triggerToast, navigate]);

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50/50">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600 mx-auto"></div>
          <p className="text-sm font-semibold text-gray-500 font-mono">
            Loading eShopNepal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-800 flex flex-col font-sans">
      <Toast toast={toast} />

      <Navbar navigate={navigate} currentPath={currentPath} />

      <main className="flex-1 flex flex-col">
        {/* <Suspense fallback={PageFallback}> */}
        {currentPath === "/products" && (
          <Homepage onNavigate={navigate} onAddToCart={handleAddToCart} />
        )}

        {currentPath === "/products/:id" && selectedProductId && (
          <ProductDetailView
            productId={selectedProductId}
            navigate={navigate}
            onSuccess={(m) => triggerToast("success", m)}
            onError={(m) => triggerToast("error", m)}
          />
        )}

        {currentPath === "/cart" && (
          <CartView
            cartItems={cartItems}
            getCartTotal={getCartTotal}
            getDiscountedTotal={getDiscountedTotal}
            discountPercentage={discountPercentage}
            appliedCouponCode={appliedCouponCode}
            applyCouponCode={applyCouponCode}
            clearCouponCode={clearCouponCode}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            onNavigate={navigate}
            triggerToast={triggerToast}
          />
        )}

        {currentPath === "/checkout" && (
          <CheckoutView
            cartItems={cartItems}
            getDiscountedTotal={getDiscountedTotal}
            checkoutBilling={checkoutBilling}
            setCheckoutBilling={setCheckoutBilling}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            onSubmit={handlePlaceOrder}
            formSubmitting={formSubmitting}
          />
        )}

        {currentPath === "/dashboard" && (
          <ConsumerDashboard
            navigate={navigate}
            onSuccess={() => {}}
            onError={() => {}}
          />
        )}

        {currentPath === "/order-confirmation" && (
          <OrderConfirmationView
            order={activeOrder}
            loading={activeOrderLoading}
            onNavigate={navigate}
          />
        )}

        {currentPath === "/login" && (
          <LoginView
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            onSubmit={handleLogin}
            onNavigate={navigate}
            formSubmitting={formSubmitting}
            showGoogleLogin={hasGoogleOAuth}
            onGoogleSuccess={(u) => setUser(u)}
          />
        )}

        {currentPath === "/register" && (
          <RegisterView
            registerForm={registerForm}
            setRegisterForm={setRegisterForm}
            onSubmit={handleRegister}
            onNavigate={navigate}
            formSubmitting={formSubmitting}
            showGoogleLogin={hasGoogleOAuth}
            onGoogleSuccess={(u) => setUser(u)}
          />
        )}
        {/* </Suspense> */}
      </main>

      <footer className="w-full bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} eShopNepal. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function App() {
  const rawGoogleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasGoogleOAuth =
    !!rawGoogleId &&
    rawGoogleId !== "GOCSPX-placeholder" &&
    rawGoogleId !== "123456789-placeholder.apps.googleusercontent.com";
  const googleClientId = rawGoogleId || "GOCSPX-placeholder";

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
