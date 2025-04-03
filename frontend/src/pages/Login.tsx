import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faGoogle,
  faTwitter,
  faGithub,
  faKeycdn,
} from "@fortawesome/free-brands-svg-icons";
import { Toaster, toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // If token exists, redirect to dashboard
    if (localStorage.getItem("token")) {
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
