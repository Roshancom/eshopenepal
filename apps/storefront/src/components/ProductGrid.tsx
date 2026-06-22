import React, { useEffect, useState } from "react";
import { Product, productsApi, categoryApi } from "@eshopnepal/shared";

interface ProductCardProps {
  product: Product;
  onNavigate: (path: string) => void;
  onAddToCart: (productId: number, name: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({ product, onNavigate, onAddToCart }) => {
    const isSale =
      product.sale_price !== null &&
      Number(product.sale_price) < Number(product.price);
    const currentPrice = isSale
      ? Number(product.sale_price)
      : Number(product.price);

    return (
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm hover:shadow-md transition-all duration-300">
        <div
          onClick={() => onNavigate(`/products/${product.id}`)}
          className="space-y-3 cursor-pointer"
        >
          <div className="overflow-hidden rounded-xl bg-gray-50 aspect-square flex items-center justify-center p-3 relative">
            <img
              src={
                product.image_url ||
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
              }
              alt={product.name}
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
              {product.category_name}
            </span>
            <h3 className="mt-1 text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">
              {product.description || ""}
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
                ${Number(product.price).toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product.id, product.name)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Add to Cart
          </button>
        </div>
      </div>
    );
  },
);

ProductCard.displayName = "ProductCard";

const ProductGridSkeleton: React.FC = React.memo(() => {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm animate-pulse"
        >
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
  );
});

ProductGridSkeleton.displayName = "ProductGridSkeleton";

interface ProductGridProps {
  selectedCategory: number | null;
  onNavigate: (path: string) => void;
  onAddToCart: (productId: number, name: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = React.memo(
  ({ selectedCategory, onNavigate, onAddToCart }) => {
    const [productsLoading, setProductsLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
      let cancelled = false;
      setProductsLoading(true);
      productsApi
        .getAll(selectedCategory || undefined)
        .then((data) => {
          if (!cancelled) setProducts(data);
        })
        .catch(console.error)
        .finally(() => {
          if (!cancelled) setProductsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [selectedCategory]);

    if (productsLoading) {
      return <ProductGridSkeleton />;
    }

    if (products.length === 0) {
      return (
        <div className="py-24 text-center">
          <p className="text-sm text-gray-500">No products found.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((prod) => (
          <ProductCard
            key={prod.id}
            product={prod}
            onNavigate={onNavigate}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    );
  },
);

ProductGrid.displayName = "ProductGrid";
