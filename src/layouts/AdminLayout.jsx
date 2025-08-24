// src/components/AdminLayout.jsx
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 transition duration-200 ease-in-out z-50`}
      >
        <h1 className="text-2xl font-bold text-center">Smart Attendance</h1>

        <nav className="mt-10">
          <Link
            to="/admin"
            className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/teachers"
            className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
          >
            Manage Teachers
          </Link>
          <Link
            to="/admin/students"
            className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
          >
            Manage Students
          </Link>
          <Link
            to="/admin/classes"
            className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
          >
            Manage Classes
          </Link>
          <Link
            to="/admin/attendance"
            className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
          >
            Manage Attendance
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="bg-white shadow-md p-4 flex items-center justify-between md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          <h2 className="text-lg font-semibold">Admin Dashboard</h2>
          <button
            onClick={() => {
              // logout logic here
              window.location.href = "/";
            }}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        </header>

        {/* Desktop top bar */}
        <div className="hidden md:flex justify-between items-center bg-white p-4 shadow">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
          <button
            onClick={() => {
              // logout logic here
              window.location.href = "/";
            }}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>

        {/* Actual page content */}
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
