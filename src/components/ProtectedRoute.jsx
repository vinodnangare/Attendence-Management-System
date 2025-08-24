import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen grid place-items-center">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    // If not logged in → send to login
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(profile.role)) {
    // Role mismatch → redirect to correct dashboard
    const fallback =
      profile.role === "admin"
        ? "/admin"
        : profile.role === "teacher"
        ? "/teacher"
        : "/student";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />; // Allowed
}
