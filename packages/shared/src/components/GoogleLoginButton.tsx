import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { authApi } from "../utils/api";

interface GoogleLoginButtonProps {
  role?: "consumer" | "admin";
  onSuccess: (user: { id: number; username: string; email: string; role: string }) => void;
  onError: (message: string) => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  role,
  onSuccess,
  onError,
}) => {
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const data = await authApi.googleLogin(credentialResponse.credential, role);
      onSuccess(data.user);
    } catch (err: any) {
      onError(err.response?.data?.error || "Google login failed.");
    }
  };

  const handleGoogleError = () => {
    onError("Google login failed. Please try again.");
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400 font-semibold">
            or continue with
          </span>
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          size="large"
          width="100%"
          text="signin_with"
          shape="rectangular"
          theme="outline"
        />
      </div>
    </div>
  );
};
