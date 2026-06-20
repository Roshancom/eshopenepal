import React from "react";
import type { Product } from "@eshopnepal/shared";
import { Plus, Trash2 } from "lucide-react";

interface AdminProductsViewProps {
  products: Product[];
  loading: boolean;
  onNavigate: (path: string) => void;
  onDeleteProduct: (id: number) => void;
}

const ProductSkeleton = () => (
  <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col justify-between shadow-sm animate-pulse">
    <div className="space-y-3">
      <div className="h-32 w-full rounded-lg bg-gray-100"></div>
      <div className="space-y-2">
        <div className="h-4 w-16 rounded-full bg-gray-100"></div>
        <div className="h-3 w-3/4 rounded bg-gray-100"></div>
      </div>
    </div>
    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
      <div className="h-4 w-12 rounded bg-gray-100"></div>
      <div className="h-5 w-14 rounded bg-gray-100"></div>
    </div>
  </div>
);

export const AdminProductsView: React.FC<AdminProductsViewProps> = ({
  products,
  loading,
  onNavigate,
  onDeleteProduct,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-50 pb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-950">Products</h1>
          <p className="text-xs text-gray-500">Manage your product catalog.</p>
        </div>
        <button
          onClick={() => onNavigate("/admin/products/add")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 cursor-pointer"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
        ) : products.map((prod) => (
          <div
            key={prod.id}
            className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <img
                src={
                  prod.image_url ||
                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
                }
                alt={prod.name}
                className="h-32 w-full rounded-lg object-cover border border-gray-50"
              />
              <div>
                <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-600">
                  {prod.category_name || "General"}
                </span>
                <h3 className="mt-1.5 text-xs font-bold text-gray-950 line-clamp-1">
                  {prod.name}
                </h3>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-600 font-sans">
                ${parseFloat(String(prod.price)).toFixed(2)}
              </span>
              <button
                onClick={() => onDeleteProduct(prod.id)}
                className="p-1 px-2.5 hover:bg-rose-50 text-rose-500 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
