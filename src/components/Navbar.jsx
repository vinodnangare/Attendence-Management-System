import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthAPI, auth } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  async function logout() {
    await AuthAPI.signOut(auth);
    navigate("/");
  }

  return (
    <nav className="w-full bg-white border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold">Smart Attendance</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {profile ? `Role: ${profile.role}` : ""}
          </span>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
