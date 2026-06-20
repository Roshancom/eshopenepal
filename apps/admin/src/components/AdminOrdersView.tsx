import React, { useState, useEffect } from 'react';
import type { Order } from '@eshopnepal/shared';
import { ordersApi } from '@eshopnepal/shared';
import { Receipt } from 'lucide-react';

interface AdminOrdersViewProps {
  navigate: (path: string) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({ navigate, onSuccess, onError }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getAll();
      setOrders(data);
    } catch (err) {
      console.error(err);
      onError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId: number, status: string) => {
    setUpdatingId(orderId);
    try {
      await ordersApi.updateStatus(orderId, status);
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)));
      onSuccess(`Order #${orderId} status changed to ${status}.`);
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'processing': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'shipped': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-200 border-t-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-950">Orders</h1>
          <p className="text-xs text-gray-500">View and manage customer orders.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center bg-gray-50/50">
          <Receipt className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-sm text-gray-500">No orders yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/70 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/40">
                  <td className="px-6 py-4 font-bold text-gray-950">#{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{order.username}</div>
                    <div className="text-xs text-gray-500 font-mono">{order.email}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-amber-600">${parseFloat(String(order.total_amount)).toFixed(2)}</td>
                  <td className="px-6 py-4 text-xs text-gray-600">{order.payment_method}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer outline-none focus:ring-1 focus:ring-amber-500 ${getStatusColor(order.status)}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-600 hover:border-amber-100 hover:bg-amber-50 hover:text-amber-700 transition-all cursor-pointer shadow-sm"
                      title="View details"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
