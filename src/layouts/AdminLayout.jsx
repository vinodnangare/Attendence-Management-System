// src/components/AdminLayout.jsx
import React, { useState } from "react";
import { Menu, X, Home, Users, GraduationCap, Book, ClipboardList, LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-2 py-2.5 px-4 rounded transition duration-200 text-sm font-medium
     ${isActive ? "bg-blue-600 text-white font-semibold shadow-md" : "text-gray-200 hover:bg-gray-700 hover:text-white"}`;

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 transition duration-200 ease-in-out z-50`}
      >
        <h1 className="text-2xl font-bold text-center">Smart Attendance</h1>

        <nav className="mt-10 space-y-1">
          <NavLink to="/admin" end className={linkClasses}>
            <Home size={18} />
            Dashboard
          </NavLink>
          <NavLink to="/admin/teachers" className={linkClasses}>
            <Users size={18} />
            Manage Teachers
          </NavLink>
          <NavLink to="/admin/students" className={linkClasses}>
            <GraduationCap size={18} />
            Manage Students
          </NavLink>
          <NavLink to="/admin/classes" className={linkClasses}>
            <Book size={18} />
            Manage Classes
          </NavLink>
          <NavLink to="/admin/attendance" className={linkClasses}>
            <ClipboardList size={18} />
            Manage Attendance
          </NavLink>
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="bg-white shadow-md p-4 flex items-center justify-between md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          <h2 className="text-lg font-semibold">Admin Dashboard</h2>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded"
          >
            <LogOut size={16} />
            Logout
          </button>
        </header>

        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center bg-white p-4 shadow">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
