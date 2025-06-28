import React, { useEffect } from "react";
import { Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setBranch } = useAuth()

  useEffect(() => {
    // If token exists, redirect to dashboard
    let token = localStorage.getItem("token");
    if (token) {
      const tokenDecoded = jwtDecode<{branch_name: string, branch_id: number}>(token);
      setBranch({id:tokenDecoded.branch_id,name: tokenDecoded.branch_name as string})
      navigate("/dashboard");
    }
  }, []);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-200 p-4 sm:p-6">
        {/* Toast Notifications */}
        <Toaster richColors position="bottom-right" />

        {/* Login Form */}
        <LoginForm />

        {/* Additional Text */}
        <p className="mt-4 text-gray-500 text-sm sm:text-base text-center">
          {/* Add any additional text here if needed */}
        </p>

        {/* Contact Admin Link */}
        <p className="mt-2 text-gray-500 text-sm sm:text-base text-center">
          Don't have an account?{" "}
          <a
            href="#"
            className="text-blue-500 hover:underline transition-all duration-200"
          >
            Contact Admin
          </a>
        </p>
      </div>
    </>
  );
};

export default LoginPage;
