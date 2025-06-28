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
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { baseUrl } from "../../utils/services";
import { useAuth } from "../context/AuthContext";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setUsername, setBranch } = useAuth();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${baseUrl}/api/auth/login`, {
        username: email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      setUsername(email);
      const decodedToken = jwtDecode<{ role: string, id: number, branch_name: string, branch_id: number }>(response.data.token);
      setBranch({ id: decodedToken.branch_id, name: decodedToken.branch_name })
      const userRole = decodedToken.role;

      // Redirect based on role
      if (userRole === "staff") {
        navigate("/pos");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.warning(err.response?.data?.message || "Login failed. Try again.");
    }
  };

  return (
    <>
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-lg shadow-md">
        {/* Logo and Title */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center">
            <div className="text-rose-500 mr-2">
              <FontAwesomeIcon icon={faKeycdn} className="text-sm" />
            </div>
            <h1 className="text-gray-700 text-lg sm:text-xl font-bold">
              Trade App
            </h1>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-center text-gray-400 text-sm sm:text-base mb-6">
          Enter your username and password
          <br />
          to access panel.
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Username Input */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-start text-gray-500 text-sm sm:text-base mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="email"
              placeholder="Enter your username here"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-start text-gray-500 text-sm sm:text-base mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm sm:text-base"
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

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-200 text-sm sm:text-base"
          >
            Log In
          </button>
        </form>

        {/* Additional Content (if any) */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 mb-4"></p>
        </div>
      </div>
    </>
  );
};

export default LoginForm;
