import React from "react";
import { CreditCard } from "lucide-react";

interface AdminPaymentsViewProps {
  stripeConfig: { stripeEnabled: boolean; publicKey: string | null };
}

export const AdminPaymentsView: React.FC<AdminPaymentsViewProps> = ({
  stripeConfig,
}) => {
  return (
    <div className="max-w-xl space-y-6">
      <div className="border-b border-gray-50 pb-4">
        <h1 className="text-lg font-bold text-gray-950">
          Payment Settings
        </h1>
        <p className="text-xs text-gray-500">
          Configure payment gateway.
        </p>
      </div>
      <div className="p-5 rounded-2xl border border-amber-100 bg-amber-50/50 text-amber-800 space-y-2">
        <h3 className="text-sm font-bold flex items-center gap-1.5">
          <CreditCard size={16} /> Stripe Configuration
        </h3>
        <p className="text-xs leading-relaxed">
          Set{" "}
          <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">
            STRIPE_PUBLIC_KEY
          </code>{" "}
          and{" "}
          <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">
            STRIPE_SECRET_KEY
          </code>{" "}
          in the server .env file. Currently defaults to{" "}
          <strong>Cash on Delivery</strong>.
        </p>
      </div>
      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white">
        <div>
          <p className="text-sm font-bold text-gray-900">Stripe</p>
          <p className="text-xs text-gray-400">
            Online payment gateway
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${stripeConfig.stripeEnabled ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
        >
          {stripeConfig.stripeEnabled
            ? "Connected"
            : "Disconnected (COD)"}
        </span>
      </div>
    </div>
  );
};
