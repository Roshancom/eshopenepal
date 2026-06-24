import React, { useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";

interface PaymentResultViewProps {
  navigate: (path: string) => void;
}

/**
 * PaymentResultView — displayed after eSewa redirects back.
 * Reads query params from the hash route to determine status.
 *
 * URL format: /payment-result?status=success&orderId=123&refId=abc
 * URL format: /payment-result?status=failed&message=...
 * URL format: /payment-result?status=error&message=...
 */
export const PaymentResultView: React.FC<PaymentResultViewProps> = ({
  navigate,
}) => {
  const [status, setStatus] = React.useState<string>("loading");
  const [message, setMessage] = React.useState<string>("");
  const [orderId, setOrderId] = React.useState<string>("");
  const [refId, setRefId] = React.useState<string>("");

  useEffect(() => {
    // Parse query params from the hash route
    // The hash looks like: /payment-result?status=success&orderId=123
    const hash = window.location.hash.substring(1); // remove #
    const queryIdx = hash.indexOf("?");
    if (queryIdx === -1) {
      setStatus("error");
      setMessage("No payment information received.");
      return;
    }

    const params = new URLSearchParams(hash.substring(queryIdx));
    setStatus(params.get("status") || "error");
    setMessage(params.get("message") || "");
    setOrderId(params.get("orderId") || "");
    setRefId(params.get("refId") || "");
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  const isSuccess = status === "success";
  const isFailed = status === "failed";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
          isSuccess
            ? "bg-emerald-50 text-emerald-500"
            : isFailed
              ? "bg-rose-50 text-rose-500"
              : "bg-amber-50 text-amber-500"
        }`}
      >
        {isSuccess ? (
          <CheckCircle size={40} />
        ) : isFailed ? (
          <XCircle size={40} />
        ) : (
          <AlertCircle size={40} />
        )}
      </div>

      <h1
        className={`mt-6 text-2xl font-extrabold ${
          isSuccess
            ? "text-emerald-700"
            : isFailed
              ? "text-rose-700"
              : "text-amber-700"
        }`}
      >
        {isSuccess
          ? "Payment Successful!"
          : isFailed
            ? "Payment Failed"
            : "Payment Error"}
      </h1>

      <p className="mt-3 text-sm text-gray-500 leading-relaxed">
        {isSuccess
          ? "Your eSewa payment has been verified and your order has been confirmed. Thank you for your purchase!"
          : message
            ? decodeURIComponent(message).replace(/\+/g, " ")
            : "Your payment could not be processed. Please try again."}
      </p>

      {/* Order details for success */}
      {isSuccess && orderId && (
        <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Order ID</span>
            <span className="font-bold text-gray-900">#{orderId}</span>
          </div>
          {refId && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transaction Ref</span>
              <span className="font-mono text-xs text-gray-700">{refId}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {isSuccess && orderId && (
          <button
            onClick={() => navigate(`/order-confirmation/${orderId}`)}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            View Order Details
          </button>
        )}
        <button
          onClick={() => navigate("/products")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Continue Shopping
        </button>
      </div>
    </div>
  );
};
