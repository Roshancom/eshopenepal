import React from "react";

interface AdminCustomersViewProps {
  customers: any[];
  loading: boolean;
}

const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 w-6 rounded bg-gray-100"></div></td>
    <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-gray-100"></div></td>
    <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-gray-100"></div></td>
    <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-gray-100"></div></td>
  </tr>
);

export const AdminCustomersView: React.FC<AdminCustomersViewProps> = ({
  customers,
  loading,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-50 pb-5">
        <h1 className="text-lg font-bold text-gray-950">Customers</h1>
        <p className="text-xs text-gray-500">All registered users.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/60 text-xs font-bold uppercase tracking-wider text-gray-500">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
            ) : customers.map((cust) => (
              <tr key={cust.id} className="hover:bg-gray-50/30">
                <td className="px-6 py-4 font-bold text-gray-900">
                  #{cust.id}
                </td>
                <td className="px-6 py-4 font-semibold text-gray-950">
                  {cust.username}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-600">
                  {cust.email}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {new Date(cust.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
