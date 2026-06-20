import React from "react";
import { Package2 } from "lucide-react";
import { GoogleLoginButton } from "@eshopnepal/shared";

interface AdminRegisterProps {
  registerForm: { username: string; email: string; password: string };
  setRegisterForm: (form: { username: string; email: string; password: string }) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  registerErrors: {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
  setRegisterErrors: (errors: {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }) => void;
  passwordStrength: { score: number; label: string; color: string } | null;
  onSubmit: (e: React.FormEvent) => void;
  onNavigate: (path: string) => void;
  formSubmitting: boolean;
  showGoogleLogin?: boolean;
}

export const AdminRegister: React.FC<AdminRegisterProps> = ({
  registerForm,
  setRegisterForm,
  confirmPassword,
  setConfirmPassword,
  registerErrors,
  setRegisterErrors,
  passwordStrength,
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
            Create Admin Account
          </h1>
          <p className="text-xs text-gray-400">
            Register a new admin account.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Username
            </label>
            <input
              type="text"
              required
              value={registerForm.username}
              onChange={(e) => {
                setRegisterForm({ ...registerForm, username: e.target.value });
                if (registerErrors.username) setRegisterErrors({ ...registerErrors, username: undefined });
              }}
              className={`mt-1 w-full rounded-xl border bg-gray-50/20 py-2.5 px-3 text-sm focus:bg-white outline-none ${
                registerErrors.username
                  ? "border-rose-300 focus:border-rose-500"
                  : "border-gray-200 focus:border-amber-500"
              }`}
              placeholder="admin_user"
            />
            {registerErrors.username && (
              <p className="mt-1 text-xs text-rose-500 font-semibold">{registerErrors.username}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Email
            </label>
            <input
              type="email"
              required
              value={registerForm.email}
              onChange={(e) => {
                setRegisterForm({ ...registerForm, email: e.target.value });
                if (registerErrors.email) setRegisterErrors({ ...registerErrors, email: undefined });
              }}
              className={`mt-1 w-full rounded-xl border bg-gray-50/20 py-2.5 px-3 text-sm focus:bg-white outline-none ${
                registerErrors.email
                  ? "border-rose-300 focus:border-rose-500"
                  : "border-gray-200 focus:border-amber-500"
              }`}
              placeholder="admin@example.com"
            />
            {registerErrors.email && (
              <p className="mt-1 text-xs text-rose-500 font-semibold">{registerErrors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={registerForm.password}
              onChange={(e) => {
                setRegisterForm({ ...registerForm, password: e.target.value });
                if (registerErrors.password) setRegisterErrors({ ...registerErrors, password: undefined });
              }}
              className={`mt-1 w-full rounded-xl border bg-gray-50/20 py-2.5 px-3 text-sm focus:bg-white outline-none ${
                registerErrors.password
                  ? "border-rose-300 focus:border-rose-500"
                  : "border-gray-200 focus:border-amber-500"
              }`}
              placeholder="••••••••"
            />
            {passwordStrength && registerForm.password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        i <= passwordStrength.score ? passwordStrength.color : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-[11px] font-semibold ${
                  passwordStrength.score <= 1 ? "text-rose-500"
                  : passwordStrength.score <= 2 ? "text-orange-500"
                  : passwordStrength.score <= 3 ? "text-amber-600"
                  : "text-emerald-600"
                }`}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
            {registerErrors.password && (
              <p className="mt-1 text-xs text-rose-500 font-semibold">{registerErrors.password}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Confirm Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (registerErrors.confirmPassword) setRegisterErrors({ ...registerErrors, confirmPassword: undefined });
              }}
              className={`mt-1 w-full rounded-xl border bg-gray-50/20 py-2.5 px-3 text-sm focus:bg-white outline-none ${
                registerErrors.confirmPassword
                  ? "border-rose-300 focus:border-rose-500"
                  : "border-gray-200 focus:border-amber-500"
              }`}
              placeholder="••••••••"
            />
            {registerErrors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-500 font-semibold">{registerErrors.confirmPassword}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={formSubmitting}
            className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:bg-amber-300 cursor-pointer"
          >
            {formSubmitting ? "Creating account..." : "Register"}
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
            Already have an admin account?{" "}
          <button
            onClick={() => onNavigate("/admin/login")}
            className="font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};
