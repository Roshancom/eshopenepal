import React from "react";
import { Package2 } from "lucide-react";
import { GoogleLoginButton } from "@eshopnepal/shared";

interface AdminLoginProps {
  loginForm: { email: string; password: string };
  setLoginForm: (form: { email: string; password: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNavigate: (path: string) => void;
  formSubmitting: boolean;
  showGoogleLogin?: boolean;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  loginForm,
  setLoginForm,
  onSubmit,
  onNavigate,
  formSubmitting,
  showGoogleLogin = false,
}) => {
  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Package2 size={24} />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Admin Console
          </h1>
          <p className="text-xs text-gray-400">
            Sign in with your admin credentials.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Email / Username
            </label>
            <input
              type="text"
              required
              value={loginForm.email}
              onChange={(e) =>
                setLoginForm({ ...loginForm, email: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-amber-500 focus:bg-white outline-none"
              placeholder="admin@shop.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Password
            </label>
            <input
              type="password"
              required
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-amber-500 focus:bg-white outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={formSubmitting}
            className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:bg-amber-300 cursor-pointer"
          >
            {formSubmitting ? "Signing in..." : "Sign In"}
          </button>
          </form>
          {showGoogleLogin && (
            <GoogleLoginButton
              role="admin"
              onSuccess={(user) => {
                onNavigate("/admin/dashboard");
              }}
              onError={(msg) => {
                alert(msg);
              }}
            />
          )}
          <p className="text-center text-xs text-gray-400">
            Don't have an admin account?{" "}
          <button
            onClick={() => onNavigate("/admin/register")}
            className="font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};
