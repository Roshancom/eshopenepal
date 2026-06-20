import React from "react";
import type { CartItem } from "@eshopnepal/shared";
import { ShoppingBag, Trash2 } from "lucide-react";

interface CartViewProps {
  cartItems: CartItem[];
  getCartTotal: () => number;
  getDiscountedTotal: () => number;
  discountPercentage: number;
  appliedCouponCode: string | null;
  applyCouponCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  clearCouponCode: () => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  onNavigate: (path: string) => void;
  triggerToast: (type: "success" | "error", message: string) => void;
}

export const CartView: React.FC<CartViewProps> = ({
  cartItems,
  getCartTotal,
  getDiscountedTotal,
  discountPercentage,
  appliedCouponCode,
  applyCouponCode,
  clearCouponCode,
  updateQuantity,
  removeItem,
  onNavigate,
  triggerToast,
}) => {
  const [orderCoupon, setOrderCoupon] = React.useState("");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-gray-100 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-950">
          My Shopping Cart
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Review items, apply coupons, and checkout.
        </p>
      </div>
      {cartItems.length === 0 ? (
        <div className="py-24 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
          <ShoppingBag className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-sm font-semibold text-gray-500">
            Your cart is empty.
          </p>
          <button
            onClick={() => onNavigate("/products")}
            className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
          >
            Browse Catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const isSale =
                item.sale_price !== null &&
                Number(item.sale_price) < Number(item.price);
              const currentPrice = isSale
                ? Number(item.sale_price)
                : Number(item.price);
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-16 w-16 rounded-lg object-contain bg-gray-50 border border-gray-100"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-xs font-bold text-indigo-600 mt-1">
                        ${currentPrice.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <div className="flex items-center rounded-lg border border-gray-100 bg-gray-50/50 p-0.5">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product_id,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        className="h-8 w-8 text-sm font-bold text-gray-500 hover:text-gray-950 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-extrabold text-gray-950">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product_id,
                            Math.min(item.stock, item.quantity + 1),
                          )
                        }
                        className="h-8 w-8 text-sm font-bold text-gray-500 hover:text-gray-950 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-extrabold text-gray-950 w-[70px] text-right">
                      ${(currentPrice * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm self-start space-y-6">
            <h3 className="text-md font-extrabold text-gray-950 border-b border-gray-50 pb-3">
              Cart Summary
            </h3>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Coupon Code
              </label>
              {appliedCouponCode ? (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 border border-emerald-100">
                  <span className="text-xs font-extrabold text-emerald-800">
                    {appliedCouponCode} ({discountPercentage}% off)
                  </span>
                  <button
                    onClick={clearCouponCode}
                    className="text-xs text-rose-500 font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={orderCoupon}
                    onChange={(e) => setOrderCoupon(e.target.value)}
                    className="flex-grow rounded-lg border border-gray-200 bg-gray-50/30 py-1.5 px-3 text-xs uppercase font-extrabold outline-none focus:border-indigo-600"
                    placeholder="SAVE10"
                  />
                  <button
                    onClick={() =>
                      applyCouponCode(orderCoupon).then((res) => {
                        if (res.success) {
                          triggerToast("success", "Coupon applied!");
                          setOrderCoupon("");
                        } else
                          triggerToast(
                            "error",
                            res.error || "Invalid coupon.",
                          );
                      })
                    }
                    className="rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-sans text-gray-900">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
              {discountPercentage > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({discountPercentage}%)</span>
                  <span className="font-sans">
                    -$
                    {(
                      getCartTotal() *
                      (discountPercentage / 100)
                    ).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-extrabold text-gray-950">
                <span>Total</span>
                <span className="font-sans text-indigo-600">
                  ${getDiscountedTotal().toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate("/checkout")}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
