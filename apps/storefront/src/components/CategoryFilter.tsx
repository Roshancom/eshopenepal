import React from "react";
import type { Category } from "@eshopnepal/shared";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelect: (id: number | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = React.memo(
  ({ categories, selectedCategory, onSelect }) => {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelect(null)}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === null
              ? "bg-indigo-600 text-white shadow"
              : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
          }`}
        >
          All Departments
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-indigo-600 text-white shadow"
                : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    );
  },
);

CategoryFilter.displayName = "CategoryFilter";
