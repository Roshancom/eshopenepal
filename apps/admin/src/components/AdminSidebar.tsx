import React from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Tags,
  Receipt,
  TicketPercent,
  Users,
  BarChart3,
  CreditCard,
  ArrowLeft,
  ShieldAlert,
  LogOut,
} from "lucide-react";
import { useAuth } from "@eshopnepal/shared";

interface AdminSidebarProps {
  navigate: (path: string) => void;
  currentPath: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  navigate,
  currentPath,
}) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Products", path: "/admin/products", icon: ShoppingBag },
    { name: "Categories", path: "/admin/categories", icon: Tags },
    { name: "Orders", path: "/admin/orders", icon: Receipt },
    { name: "Coupons", path: "/admin/coupons", icon: TicketPercent },
    { name: "Customers", path: "/admin/customers", icon: Users },
    { name: "Reports", path: "/admin/reports", icon: BarChart3 },
    // { name: "Payments", path: "/admin/payments", icon: CreditCard },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <aside className="w-full md:w-64 shrink-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm self-start">
      <div className="mb-6 flex items-center gap-3 border-b border-gray-50 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">Admin Console</h2>
          <p className="text-[11px] text-gray-500 font-mono truncate max-w-[140px]">
            {user?.email}
          </p>
        </div>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPath === item.path ||
            currentPath.startsWith(item.path + "/");
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={16} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 pt-5 border-t border-gray-50 space-y-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
