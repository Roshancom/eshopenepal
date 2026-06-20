import React from "react";
import type { Category } from "@eshopnepal/shared";

interface AdminAddProductViewProps {
  productForm: {
    name: string;
    description: string;
    price: string;
    sale_price: string;
    stock: string;
    category_id: string;
    image_url: string;
  };
  setProductForm: (form: any) => void;
  productImageFile: File | null;
  setProductImageFile: (file: File | null) => void;
  categories: Category[];
  onSubmit: (e: React.FormEvent) => void;
  onNavigate: (path: string) => void;
  formSubmitting: boolean;
}

export const AdminAddProductView: React.FC<AdminAddProductViewProps> = ({
  productForm,
  setProductForm,
  productImageFile,
  setProductImageFile,
  categories,
  onSubmit,
  onNavigate,
  formSubmitting,
}) => {
  return (
    <div className="max-w-xl space-y-6">
      <div className="border-b border-gray-50 pb-4">
        <h1 className="text-lg font-bold text-gray-950">Add Product</h1>
        <p className="text-xs text-gray-500">
          Fill in the product details below.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
            Name
          </label>
          <input
            type="text"
            required
            value={productForm.name}
            onChange={(e) =>
              setProductForm({ ...productForm, name: e.target.value })
            }
            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-amber-500 focus:bg-white outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
            Description
          </label>
          <textarea
            value={productForm.description}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                description: e.target.value,
              })
            }
            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-amber-500 focus:bg-white outline-none"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={productForm.price}
              onChange={(e) =>
                setProductForm({ ...productForm, price: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-amber-500 focus:bg-white outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Sale Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={productForm.sale_price}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  sale_price: e.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-amber-500 focus:bg-white outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Stock
            </label>
            <input
              type="number"
              required
              value={productForm.stock}
              onChange={(e) =>
                setProductForm({ ...productForm, stock: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-amber-500 focus:bg-white outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Category
            </label>
            <select
              required
              value={productForm.category_id}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  category_id: e.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-amber-500 focus:bg-white outline-none cursor-pointer"
            >
              <option value="">Select...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
            Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setProductImageFile(
                e.target.files ? e.target.files[0] : null,
              )
            }
            className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
          />
          <input
            type="text"
            value={productForm.image_url}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                image_url: e.target.value,
              })
            }
            className="w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-amber-500 focus:bg-white outline-none"
            placeholder="Or paste image URL"
          />
        </div>
        <div className="pt-4 flex gap-3">
          <button
            type="submit"
            disabled={formSubmitting}
            className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:bg-amber-300 cursor-pointer"
          >
            {formSubmitting ? "Saving..." : "Save Product"}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("/admin/products")}
            className="rounded-xl border border-gray-100 px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
