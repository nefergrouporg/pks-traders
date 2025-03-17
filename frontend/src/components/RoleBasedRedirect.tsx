import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const RoleBasedRedirect: React.FC = () => {
  const { role } = useAuth(); // role might be string | null | undefined

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={role === "staff" ? "/pos" : "/dashboard"} replace />;
};

export default RoleBasedRedirect;
