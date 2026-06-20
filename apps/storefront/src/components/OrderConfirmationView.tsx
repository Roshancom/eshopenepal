import React from "react";
import type { Order } from "@eshopnepal/shared";
import { CheckCircle } from "lucide-react";

interface OrderConfirmationViewProps {
  order: Order | null;
  loading: boolean;
  onNavigate: (path: string) => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
  order,
  loading,
  onNavigate,
}) => {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      {loading ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-md space-y-6 animate-pulse">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100"></div>
          <div className="h-7 w-48 rounded bg-gray-100 mx-auto"></div>
          <div className="h-4 w-24 rounded bg-gray-100 mx-auto"></div>
          <div className="rounded-xl bg-gray-50/50 p-5 space-y-4">
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-gray-200"></div>
              <div className="h-4 w-32 rounded bg-gray-100"></div>
              <div className="h-3 w-40 rounded bg-gray-100"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-12 rounded bg-gray-200"></div>
              <div className="flex justify-between">
                <div className="h-3 w-28 rounded bg-gray-100"></div>
                <div className="h-3 w-12 rounded bg-gray-100"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-24 rounded bg-gray-100"></div>
                <div className="h-3 w-10 rounded bg-gray-100"></div>
              </div>
            </div>
          </div>
          <div className="h-11 w-full rounded-xl bg-gray-100"></div>
        </div>
      ) : order ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-md space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <CheckCircle size={32} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-950">
            Order Placed!
          </h1>
          <p className="text-xs text-gray-500 font-mono">
            Reference: #{order.id}
          </p>
          <div className="rounded-xl bg-gray-50/50 p-5 text-left text-xs space-y-4">
            {order.billing_address && (
              <div>
                <p className="font-extrabold text-gray-400 uppercase tracking-widest text-[9px]">
                  Shipped To
                </p>
                <p className="font-bold text-gray-900 mt-1">
                  {order.billing_address.full_name}
                </p>
                <p className="text-gray-600">
                  {order.billing_address.address},{" "}
                  {order.billing_address.city}
                </p>
              </div>
            )}
            {order.items && (
              <div>
                <p className="font-extrabold text-gray-400 uppercase tracking-widest text-[9px]">
                  Items
                </p>
                {order.items.map((it) => (
                  <div key={it.id} className="flex justify-between py-1">
                    <span className="text-gray-600">
                      {it.name} ({it.quantity}x)
                    </span>
                    <span className="font-sans font-bold">
                      ${(Number(it.price) * it.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-3 text-sm font-extrabold">
              <span>Total</span>
              <span className="text-indigo-600">
                ${Number(order.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate("/products")}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Order not found.</p>
      )}
    </div>
  );
};
