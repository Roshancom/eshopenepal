import React from "react";
import type { CartItem, BillingAddress } from "@eshopnepal/shared";
import { Lock } from "lucide-react";

interface CheckoutViewProps {
  cartItems: CartItem[];
  getDiscountedTotal: () => number;
  checkoutBilling: BillingAddress;
  setCheckoutBilling: (billing: BillingAddress) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  formSubmitting: boolean;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cartItems,
  getDiscountedTotal,
  checkoutBilling,
  setCheckoutBilling,
  paymentMethod,
  setPaymentMethod,
  onSubmit,
  formSubmitting,
}) => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-gray-100 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-950">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Provide shipping and payment details.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-8 lg:grid-cols-3"
      >
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-gray-950 border-b border-gray-50 pb-3">
            Shipping Address
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Full Name
              </label>
              <input
                type="text"
                required
                value={checkoutBilling.full_name}
                onChange={(e) =>
                  setCheckoutBilling({
                    ...checkoutBilling,
                    full_name: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Phone
              </label>
              <input
                type="text"
                required
                value={checkoutBilling.phone}
                onChange={(e) =>
                  setCheckoutBilling({
                    ...checkoutBilling,
                    phone: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Address
            </label>
            <input
              type="text"
              required
              value={checkoutBilling.address}
              onChange={(e) =>
                setCheckoutBilling({
                  ...checkoutBilling,
                  address: e.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                City
              </label>
              <input
                type="text"
                required
                value={checkoutBilling.city}
                onChange={(e) =>
                  setCheckoutBilling({
                    ...checkoutBilling,
                    city: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                State
              </label>
              <input
                type="text"
                required
                value={checkoutBilling.state}
                onChange={(e) =>
                  setCheckoutBilling({
                    ...checkoutBilling,
                    state: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                ZIP
              </label>
              <input
                type="text"
                required
                value={checkoutBilling.zip}
                onChange={(e) =>
                  setCheckoutBilling({
                    ...checkoutBilling,
                    zip: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none"
              />
            </div>
          </div>
          <div className="pt-6 border-t border-gray-50 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase">
              Payment Method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center rounded-xl border p-4 cursor-pointer ${paymentMethod === "Cash on Delivery" ? "border-indigo-600 bg-indigo-50/30" : "border-gray-150"}`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "Cash on Delivery"}
                  onChange={() => setPaymentMethod("Cash on Delivery")}
                  className="accent-indigo-600"
                />
                <div className="ml-3">
                  <p className="text-xs font-bold text-gray-900">
                    Cash on Delivery
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Pay when delivered
                  </p>
                </div>
              </label>
              <label
                className={`flex items-center rounded-xl border p-4 cursor-pointer ${paymentMethod === "eSewa" ? "border-emerald-600 bg-emerald-50/30" : "border-gray-150"}`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "eSewa"}
                  onChange={() => setPaymentMethod("eSewa")}
                  className="accent-emerald-600"
                />
                <div className="ml-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-extrabold text-white">
                    e
                  </span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      eSewa Payment
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Pay via eSewa
                    </p>
                  </div>
                </div>
              </label>
            </div>
            {paymentMethod === "eSewa" && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Lock size={16} />
                </div>
                <p className="text-xs leading-relaxed text-gray-700">
                  You will be redirected to <strong className="text-emerald-700">eSewa</strong> to complete your payment securely. Please ensure you have sufficient balance in your eSewa account or link a bank account for online payment.
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm self-start space-y-5">
          <h3 className="text-md font-bold text-gray-900 border-b border-gray-50 pb-3">
            Order Summary
          </h3>
          <div className="divide-y divide-gray-50">
            {cartItems.map((it) => {
              const isSale =
                it.sale_price !== null &&
                Number(it.sale_price) < Number(it.price);
              const price = isSale
                ? Number(it.sale_price)
                : Number(it.price);
              return (
                <div
                  key={it.id}
                  className="flex justify-between py-2 text-xs"
                >
                  <span className="text-gray-600 line-clamp-1 max-w-[150px]">
                    {it.name} ({it.quantity}x)
                  </span>
                  <span className="font-sans font-bold text-gray-900">
                    ${(price * it.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="flex justify-between text-base font-extrabold text-gray-950">
              <span>Total</span>
              <span className="font-sans text-indigo-600">
                ${getDiscountedTotal().toFixed(2)}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={formSubmitting}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors cursor-pointer"
          >
            {formSubmitting ? "Processing..." : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
};
