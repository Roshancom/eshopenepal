import React from "react";
import type { Product, Category } from "@eshopnepal/shared";
import { ShoppingBag } from "lucide-react";

interface ProductsListingViewProps {
  products: Product[];
  categories: Category[];
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  productsLoading: boolean;
  onNavigate: (path: string) => void;
  onAddToCart: (productId: number, name: string) => void;
}

export const ProductsListingView: React.FC<ProductsListingViewProps> = ({
  products,
  categories,
  selectedCategory,
  setSelectedCategory,
  productsLoading,
  onNavigate,
  onAddToCart,
}) => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-tr from-indigo-900 via-indigo-800 to-indigo-950 px-8 py-16 text-white shadow-lg text-center sm:text-left">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold backdrop-blur-sm">
            ✨ Summer Gala Launch Nepal
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-none">
            Complete E-Commerce Catalogue
          </h1>
          <p className="max-w-lg text-sm text-indigo-100 leading-normal">
            Connect high performance electronics, organic food packs, and
            premium woolen cardigans.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 opacity-10 sm:opacity-20 pointer-events-none flex items-center justify-center pr-12">
          <ShoppingBag size={240} />
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${selectedCategory === null ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"}`}
          >
            All Departments
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${selectedCategory === cat.id ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {products.length} products found
        </span>
      </div>

      {productsLoading ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm animate-pulse">
              <div className="space-y-3">
                <div className="aspect-square rounded-xl bg-gray-100"></div>
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-gray-100"></div>
                  <div className="h-4 w-3/4 rounded bg-gray-100"></div>
                  <div className="h-3 w-full rounded bg-gray-100"></div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                <div className="h-5 w-16 rounded bg-gray-100"></div>
                <div className="h-7 w-20 rounded-lg bg-gray-100"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm text-gray-500">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((prod) => {
            const isSale =
              prod.sale_price !== null &&
              Number(prod.sale_price) < Number(prod.price);
            const currentPrice = isSale
              ? Number(prod.sale_price)
              : Number(prod.price);
            return (
              <div
                key={prod.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div
                  onClick={() => onNavigate(`/products/${prod.id}`)}
                  className="space-y-3 cursor-pointer"
                >
                  <div className="overflow-hidden rounded-xl bg-gray-50 aspect-square flex items-center justify-center p-3 relative">
                    <img
                      src={
                        prod.image_url ||
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
                      }
                      alt={prod.name}
                      className="h-44 object-contain transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    {isSale && (
                      <span className="absolute top-2 left-2 rounded bg-indigo-600 px-2 py-0.5 text-[9px] font-extrabold text-white uppercase">
                        Sale
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {prod.category_name}
                    </span>
                    <h3 className="mt-1 text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {prod.description || ""}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold text-gray-950">
                      ${currentPrice.toFixed(2)}
                    </span>
                    {isSale && (
                      <span className="text-xs text-gray-400 line-through">
                        ${Number(prod.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onAddToCart(prod.id, prod.name)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
