import React from "react";
import type { Category } from "@eshopnepal/shared";
import { Trash2 } from "lucide-react";

interface AdminCategoriesViewProps {
  categories: Category[];
  categoryForm: { name: string };
  setCategoryForm: (form: { name: string }) => void;
  onCreateCategory: (e: React.FormEvent) => void;
  onDeleteCategory: (id: number) => void;
}

export const AdminCategoriesView: React.FC<AdminCategoriesViewProps> = ({
  categories,
  categoryForm,
  setCategoryForm,
  onCreateCategory,
  onDeleteCategory,
}) => {
  return (
    <div className="max-w-xl space-y-8">
      <div className="border-b border-gray-50 pb-4">
        <h1 className="text-lg font-bold text-gray-950">Categories</h1>
        <p className="text-xs text-gray-500">
          Create and manage product categories.
        </p>
      </div>
      <form onSubmit={onCreateCategory} className="flex gap-3">
        <input
          type="text"
          required
          value={categoryForm.name}
          onChange={(e) => setCategoryForm({ name: e.target.value })}
          className="flex-grow rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-amber-500 focus:bg-white outline-none"
          placeholder="e.g. Footwear"
        />
        <button
          type="submit"
          className="rounded-xl bg-amber-500 px-5 text-sm font-bold text-white hover:bg-amber-600 cursor-pointer whitespace-nowrap"
        >
          Add Category
        </button>
      </form>
      <div className="space-y-3">
        <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 bg-white">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span className="font-semibold text-gray-900">{c.name}</span>
              <button
                onClick={() => onDeleteCategory(c.id)}
                className="p-1 text-gray-400 hover:text-rose-500 cursor-pointer"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
