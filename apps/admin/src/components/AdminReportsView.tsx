import React, { useState, useEffect } from 'react';
import { reportApi } from '@eshopnepal/shared';
import { BarChart3, TrendingUp, ShoppingCart, DollarSign, RefreshCw, Star } from 'lucide-react';

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  completedOrders: number;
  pendingOrders: number;
  salesOverTime: Array<{ month: string; sales: number }>;
}

interface TopProduct {
  id: number;
  name: string;
  price: number | string;
  image_url: string;
  total_sold: number;
}

export const AdminReportsView: React.FC = () => {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const statsData = await reportApi.getSales();
      const topProductsData = await reportApi.getTopProducts();
      setStats(statsData);
      setTopProducts(topProductsData);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-200 border-t-amber-600"></div>
      </div>
    );
  }

  const revenue = stats ? stats.totalRevenue : 0;
  const sales = stats ? stats.totalSales : 0;
  const pending = stats ? stats.pendingOrders : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-950">Analytics</h1>
          <p className="text-xs text-gray-500">Revenue, orders, and top products.</p>
        </div>
        <button onClick={fetchReports}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Revenue</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-950">${revenue.toFixed(2)}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
            <DollarSign size={20} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Orders</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-950">{sales}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
            <ShoppingCart size={20} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Pending</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-950">{pending}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-sm">
            <RefreshCw size={18} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Avg Order</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-950">${sales > 0 ? (revenue / sales).toFixed(2) : '0.00'}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shadow-sm">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-1.5 border-b border-gray-50 pb-3">
            <BarChart3 size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-gray-900">Sales Over Time</h3>
          </div>
          <div className="flex h-48 items-end gap-3 pt-6">
            {stats?.salesOverTime.map(item => {
              const maxVal = Math.max(...stats.salesOverTime.map(s => s.sales)) || 1;
              const percentHeight = (item.sales / maxVal) * 100;
              return (
                <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="group relative w-full flex justify-center items-end">
                    <span className="absolute -top-7 rounded bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      ${item.sales.toFixed(1)}
                    </span>
                    <div style={{ height: `${percentHeight}%` }}
                      className="w-8 rounded-t bg-gradient-to-t from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 transition-all cursor-pointer shadow-sm">
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-1.5 border-b border-gray-50 pb-3">
            <Star size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-gray-900">Top Products</h3>
          </div>
          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">No sales data yet.</div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((prod, index) => (
                <div key={prod.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[10px] font-extrabold text-amber-700">
                    {index + 1}
                  </span>
                  <img src={prod.image_url} alt={prod.name} className="h-10 w-10 shrink-0 rounded-lg object-cover border border-gray-100 shadow-sm" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-xs font-bold text-gray-900">{prod.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">${parseFloat(String(prod.price)).toFixed(2)}</p>
                  </div>
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700">{prod.total_sold} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
