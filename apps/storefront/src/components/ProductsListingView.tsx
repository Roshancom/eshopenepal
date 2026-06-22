import React, { useState, useEffect, useCallback } from "react";
import type { Product, Category } from "@eshopnepal/shared";
import { categoryApi } from "@eshopnepal/shared";
import { ShoppingBag } from "lucide-react";
import { CategoryFilter } from "./CategoryFilter";
import { ProductGrid } from "./ProductGrid";

export interface ProductsListingViewProps {
  onNavigate: (path: string) => void;
  onAddToCart: (productId: number, name: string) => void;
}

export const ProductsListingView: React.FC<ProductsListingViewProps> = ({
  onNavigate,
  onAddToCart,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Fetch categories once on mount
  useEffect(() => {
    categoryApi.getAll().then(setCategories).catch(console.error);
  }, []);

  // Fetch products when category changes (with cleanup to prevent stale updates)

  const handleSelectCategory = useCallback((id: number | null) => {
    setSelectedCategory(id);
  }, []);

  return (
    <>
      {/* Category Filter + Product Count */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={handleSelectCategory}
        />
      </div>

      {/* Product Grid */}
      <ProductGrid
        selectedCategory={selectedCategory}
        onNavigate={onNavigate}
        onAddToCart={onAddToCart}
      />
    </>
  );
};
