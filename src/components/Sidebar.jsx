// Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { User, Book, ClipboardCheck, Home, LogOut } from "lucide-react";

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role;

  const links = {
    admin: [
      { to: "/admin", label: "Dashboard", icon: Home },
      { to: "/admin/teachers", label: "Teachers", icon: User },
      { to: "/admin/students", label: "Students", icon: User },
      { to: "/admin/classes", label: "Classes", icon: Book },
    ],
    teacher: [
      { to: "/teacher", label: "Dashboard", icon: Home },
      { to: "/teacher/mark", label: "Mark Attendance", icon: ClipboardCheck },
      { to: "/teacher/history", label: "History", icon: Book },
    ],
    student: [
      { to: "/student", label: "Dashboard", icon: Home },
      { to: "/student/report", label: "Report", icon: Book },
    ],
  }[role] || [];

  const handleLogout = async () => {
    console.log("Logout button clicked");
    try {
      await logout();
      console.log("Logout successful, navigating to /");
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <aside className="fixed top-0 left-0 w-56 bg-white border-r min-h-screen shadow-lg flex flex-col z-50">
  
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          S
        </div>
        <span className="text-lg font-bold text-gray-700">Smart Attendance</span>
      </div>

      <div className="px-4 py-3 text-sm font-semibold text-gray-500 uppercase border-b">
        {role || "Menu"}
      </div>

 
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}

              end={
                link.to === "/admin" ||
                link.to === "/teacher" ||
                link.to === "/student"
              }
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              {Icon && <Icon size={18} />}
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Profile + Logout */}
      {profile && (
        <div className="px-4 py-4 border-t flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                {profile.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-gray-700 font-semibold text-sm">
                {profile.name}
              </span>
              <span className="text-gray-500 text-xs">{profile.role}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="cursor-pointer flex items-center justify-center gap-2 mt-3 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-semibold text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
