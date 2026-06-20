import React from "react";
import type { Coupon } from "@eshopnepal/shared";

interface AdminCouponsViewProps {
  coupons: Coupon[];
  couponForm: { code: string; discount_percent: number };
  setCouponForm: (form: { code: string; discount_percent: number }) => void;
  onCreateCoupon: (e: React.FormEvent) => void;
  onToggleCoupon: (id: number, currentActive: boolean) => void;
}

export const AdminCouponsView: React.FC<AdminCouponsViewProps> = ({
  coupons,
  couponForm,
  setCouponForm,
  onCreateCoupon,
  onToggleCoupon,
}) => {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="border-b border-gray-50 pb-4">
        <h1 className="text-lg font-bold text-gray-950">Coupons</h1>
        <p className="text-xs text-gray-500">
          Manage promo codes and discounts.
        </p>
      </div>
      <form
        onSubmit={onCreateCoupon}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/30 p-4 rounded-xl border border-gray-100/50"
      >
        <div>
          <label className="block text-[11px] font-bold text-gray-500">
            Code
          </label>
          <input
            type="text"
            required
            value={couponForm.code}
            onChange={(e) =>
              setCouponForm({ ...couponForm, code: e.target.value })
            }
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-1.5 px-2.5 text-xs text-gray-800 uppercase outline-none"
            placeholder="SAVE20"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500">
            Discount %
          </label>
          <input
            type="number"
            required
            min="1"
            max="100"
            value={couponForm.discount_percent}
            onChange={(e) =>
              setCouponForm({
                ...couponForm,
                discount_percent: parseInt(e.target.value, 10) || 10,
              })
            }
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-1.5 px-2.5 text-xs outline-none"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-500 py-1.5 text-xs font-bold text-white hover:bg-amber-600 cursor-pointer"
          >
            Create
          </button>
        </div>
      </form>
      <div className="space-y-3">
        <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 bg-white">
          {coupons.map((cp) => (
            <div
              key={cp.id}
              className="flex items-center justify-between px-4 py-3.5 text-sm"
            >
              <div>
                <span className="font-extrabold text-amber-700 tracking-wide bg-amber-50 px-2 py-1 rounded">
                  {cp.code}
                </span>
                <span className="ml-3 font-semibold text-gray-700">
                  {cp.discount_percent}% off
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold ${cp.is_active ? "text-emerald-600" : "text-gray-400"}`}
                >
                  {cp.is_active ? "Active" : "Disabled"}
                </span>
                <button
                  onClick={() => onToggleCoupon(cp.id, !!cp.is_active)}
                  className="rounded bg-gray-100 hover:bg-gray-200 px-3 py-1 text-xs font-bold text-gray-600 cursor-pointer"
                >
                  Toggle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
