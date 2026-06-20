import React from "react";
import type { Order } from "@eshopnepal/shared";

interface AdminOrderDetailViewProps {
  order: Order | null;
  loading: boolean;
  onNavigate: (path: string) => void;
}

export const AdminOrderDetailView: React.FC<AdminOrderDetailViewProps> = ({
  order,
  loading,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="h-6 w-32 rounded bg-gray-100"></div>
            <div className="h-8 w-16 rounded-lg bg-gray-100"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-gray-200"></div>
              <div className="h-4 w-24 rounded bg-gray-100"></div>
              <div className="h-3 w-32 rounded bg-gray-100"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-gray-200"></div>
              <div className="h-4 w-40 rounded bg-gray-100"></div>
              <div className="h-3 w-28 rounded bg-gray-100"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 w-12 rounded bg-gray-100"></div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-100"></div>
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 rounded bg-gray-100"></div>
                      <div className="h-2.5 w-20 rounded bg-gray-100"></div>
                    </div>
                  </div>
                  <div className="h-3 w-12 rounded bg-gray-100"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : order ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <h2 className="text-lg font-bold text-gray-950">
              Order #{order.id}
            </h2>
            <button
              onClick={() => onNavigate("/admin/orders")}
              className="rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Back
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400">
                Customer
              </p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {order.username}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {order.email}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400">
                Shipping
              </p>
              {order.billing_address ? (
                <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                  <p className="font-bold">
                    {order.billing_address.full_name} (
                    {order.billing_address.phone})
                  </p>
                  <p>
                    {order.billing_address.address},{" "}
                    {order.billing_address.city}
                  </p>
                  <p>
                    {order.billing_address.state},{" "}
                    {order.billing_address.zip}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-rose-500">
                  No address on file.
                </p>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Items</h3>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white p-4">
              {order.items?.map((it: any) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={it.image_url}
                      alt={it.name}
                      className="h-10 w-10 rounded-lg object-cover border border-gray-50"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {it.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Qty: {it.quantity} x $
                        {parseFloat(String(it.price)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600">
                    $
                    {(
                      parseFloat(String(it.price)) * it.quantity
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Order not found.</p>
      )}
    </div>
  );
};
