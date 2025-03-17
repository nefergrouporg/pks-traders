import React, { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, Outlet } from "react-router-dom";
import { baseUrl } from "../../utils/services";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { setRole, setUsername, username } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      if (!username) {
        const decoded = jwtDecode(token);
        if (decoded.username) setUsername(decoded?.username);
      }

      try {
        const response = await axios.get(`${baseUrl}/api/auth/validate`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRole(response.data.user.role);

        setIsAuthenticated(true);

        // Add immediate redirect if needed
        if (
          response.data.user.role === "staff" &&
          window.location.pathname === "/dashboard"
        ) {
          window.location.href = "/pos";
        }
      } catch (error) {
        setIsAuthenticated(false);
        localStorage.removeItem("token");
        setRole(null);
        setUsername(null);
      }
    };

    checkAuth();
  }, [setRole]);

  if (isAuthenticated === null) return <p>Loading...</p>;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
