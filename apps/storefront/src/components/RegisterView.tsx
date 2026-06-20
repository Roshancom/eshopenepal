import React from "react";
import { Package2 } from "lucide-react";
import { GoogleLoginButton } from "@eshopnepal/shared";

interface RegisterViewProps {
  registerForm: { username: string; email: string; password: string };
  setRegisterForm: (form: { username: string; email: string; password: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNavigate: (path: string) => void;
  formSubmitting: boolean;
  showGoogleLogin?: boolean;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  registerForm,
  setRegisterForm,
  onSubmit,
  onNavigate,
  formSubmitting,
  showGoogleLogin = false,
}) => {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Package2 size={24} />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Create Account
          </h1>
          <p className="text-xs text-gray-400">
            Register to start shopping and tracking orders.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Username
            </label>
            <input
              type="text"
              required
              value={registerForm.username}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  username: e.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Email
            </label>
            <input
              type="email"
              required
              value={registerForm.email}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  email: e.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Password
            </label>
            <input
              type="password"
              required
              value={registerForm.password}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  password: e.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/20 py-2.5 px-3 text-sm focus:border-indigo-600 focus:bg-white outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={formSubmitting}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-300 cursor-pointer"
          >
            {formSubmitting ? "Registering..." : "Create Account"}
          </button>          </form>
          {showGoogleLogin && (
            <GoogleLoginButton
              role="consumer"
              onSuccess={(user) => {
                onNavigate("/products");
              }}
              onError={(msg) => {
                alert(msg);
              }}
            />
          )}
          <div className="border-t border-gray-50 pt-4 text-center text-xs">
            <p className="text-gray-500">
              Already have an account?{" "}
            <button
              onClick={() => onNavigate("/login")}
              className="font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
