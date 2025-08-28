import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { Menu, X } from "lucide-react";

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
    
      <aside className="hidden sm:flex flex-col w-64 bg-white shadow-lg">
        <Sidebar activePage={location.pathname} />
      </aside>

      <div className="flex-1 flex flex-col">
    
        <div className="hidden sm:flex w-full">
          <Navbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activePage={location.pathname}
          />
        </div>

        
        <div className="sm:hidden flex items-center justify-between bg-white shadow-lg px-4 py-3 sticky top-0 z-30 rounded-b-2xl">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-700 focus:outline-none"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-lg tracking-wide text-purple-600">
            Student Dashboard
          </span>
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-black opacity-30"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <div className="relative w-64 bg-white shadow-2xl rounded-2xl flex flex-col p-4">
              <button
                className="self-end mb-4 text-gray-700"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={24} />
              </button>
              <Sidebar activePage={location.pathname} />
            </div>
          </div>
        )}

       
        <main className="flex-1 p-6 bg-white  shadow-xl min-h-[80vh]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
