import React, { useState, useEffect } from "react";
import type { Order, BillingAddress } from "@eshopnepal/shared";
import { ordersApi, billingApi } from "@eshopnepal/shared";
import {
  Receipt, MapPin, User, Phone, Globe, Calendar, ShoppingBag,
} from "lucide-react";

interface ConsumerDashboardProps {
  navigate: (path: string) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const ConsumerDashboard: React.FC<ConsumerDashboardProps> = ({ navigate, onSuccess, onError }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [billing, setBilling] = useState<BillingAddress>({
    full_name: "", phone: "", address: "", city: "", state: "", zip: "", country: "Nepal",
  });
  const [billingLoading, setBillingLoading] = useState(true);
  const [savingBilling, setSavingBilling] = useState(false);

  useEffect(() => {
    ordersApi.getMyOrders().then(setOrders).catch(console.error).finally(() => setOrdersLoading(false));
    billingApi.get().then(d => {
      if (d) setBilling({
        full_name: d.full_name || "", phone: d.phone || "", address: d.address || "",
        city: d.city || "", state: d.state || "", zip: d.zip || "", country: d.country || "Nepal",
      });
    }).catch(console.error).finally(() => setBillingLoading(false));
  }, []);

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBilling(true);
    try {
      await billingApi.save(billing);
      onSuccess("Billing address saved.");
    } catch (err: any) {
      onError(err.response?.data?.error || "Failed to save billing address.");
    } finally {
      setSavingBilling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "processing": return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "shipped": return "bg-sky-50 text-sky-700 border-sky-100";
      case "cancelled": return "bg-rose-50 text-rose-700 border-rose-100";
      default: return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-gray-100 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">My Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500">Track your orders and manage billing.</p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
            <Receipt className="text-indigo-600" size={18} />
            <h2 className="text-lg font-bold text-gray-900">Order History</h2>
          </div>

          {ordersLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center bg-gray-50/50">
              <ShoppingBag className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-500">No orders yet.</p>
              <button onClick={() => navigate("/products")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id}
                  className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">Order #{order.id}</span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Calendar size={13} /> {new Date(order.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{order.payment_method}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400">Total</p>
                      <p className="text-lg font-bold text-indigo-600">${parseFloat(String(order.total_amount)).toFixed(2)}</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm self-start">
          <div className="mb-6 flex items-center gap-2 border-b border-gray-50 pb-3">
            <MapPin className="text-indigo-600" size={18} />
            <h2 className="text-md font-bold text-gray-900">Billing Address</h2>
          </div>

          {billingLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSaveBilling} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</label>
                <div className="relative mt-1">
                  <User className="absolute top-3 left-3 text-gray-400" size={16} />
                  <input type="text" required value={billing.full_name}
                    onChange={e => setBilling({ ...billing, full_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-600 focus:bg-white outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Phone</label>
                <div className="relative mt-1">
                  <Phone className="absolute top-3 left-3 text-gray-400" size={16} />
                  <input type="text" required value={billing.phone}
                    onChange={e => setBilling({ ...billing, phone: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-600 focus:bg-white outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Address</label>
                <input type="text" required value={billing.address}
                  onChange={e => setBilling({ ...billing, address: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">City</label>
                  <input type="text" required value={billing.city}
                    onChange={e => setBilling({ ...billing, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">State</label>
                  <input type="text" required value={billing.state}
                    onChange={e => setBilling({ ...billing, state: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">ZIP</label>
                  <input type="text" required value={billing.zip}
                    onChange={e => setBilling({ ...billing, zip: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Country</label>
                  <div className="relative mt-1">
                    <Globe className="absolute top-3 left-3 text-gray-400" size={16} />
                    <input type="text" required value={billing.country}
                      onChange={e => setBilling({ ...billing, country: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-600 focus:bg-white outline-none" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={savingBilling}
                className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-300 cursor-pointer">
                {savingBilling ? "Saving..." : "Save Address"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
