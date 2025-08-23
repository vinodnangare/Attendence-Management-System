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

  // Allow access for demo logins (no user/profile)
  if (!user && !profile) return <Outlet />;

  if (!user) return <Navigate to="/" replace />;

  if (!profile || !allowedRoles.includes(profile.role)) {
    // Role mismatch → send to their dashboard if any
    const fallback =
      profile?.role === "admin"
        ? "/admin"
        : profile?.role === "teacher"
        ? "/teacher"
        : profile?.role === "student"
        ? "/student"
        : "/";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
