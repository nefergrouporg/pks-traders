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

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If token exists, redirect to dashboard
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          username: email, // Backend expects "username", so we send email as username
          password,
        }
      );

      // Store token in localStorage (or cookies if using HttpOnly)
      localStorage.setItem("token", response.data.token);

      // Redirect user after login (e.g., to dashboard)
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.warning(err.response?.data?.message || "Login failed. Try again.");
    }
  };

  return (
    <>
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center">
            <div className="text-rose-500 mr-2">
              <FontAwesomeIcon icon={faKeycdn} className="text-sm" />
            </div>
            <h1 className="text-gray-700 text-xl font-bold">NEFER GROUP</h1>
          </div>
        </div>
        <p className="text-center text-gray-400 mb-6">
          Enter your email address and password
          <br />
          to access admin panel.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-start text-gray-500 mb-2"
            >
              Email
            </label>
            <input
              type="text"
              id="email"
              placeholder="Enter your email here"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-start text-gray-500 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-200"
          >
            Log In
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 mb-4">Sign in with</p>
          <div className="flex justify-center space-x-4">
            <a
              href="#"
              className="text-blue-500 transition-all duration-200 hover:text-blue-700"
            >
              <FontAwesomeIcon icon={faFacebookF} className="text-sm" />
            </a>
            <a
              href="#"
              className="text-red-500 transition-all duration-200 hover:text-red-700"
            >
              <FontAwesomeIcon icon={faGoogle} className="text-sm" />
            </a>
            <a
              href="#"
              className="text-blue-400 transition-all duration-200 hover:text-blue-600"
            >
              <FontAwesomeIcon icon={faTwitter} className="text-sm" />
            </a>
            <a
              href="#"
              className="text-gray-700 transition-all duration-200 hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faGithub} className="text-sm" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginForm;
