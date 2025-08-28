import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import Footer from "../components/Footer.jsx";
import { Menu, X } from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50 relative">
   
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <Sidebar />
      </aside>

   
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black opacity-30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 bg-white shadow-2xl p-4 flex flex-col animate-slide-in">
            <button
              className="self-end mb-4 text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={24} />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-screen">
    
        <div className="w-full flex-shrink-0 sticky top-0 z-40 bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <button
              className="lg:hidden text-gray-700 focus:outline-none"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <span className="font-semibold text-lg text-gray-700">
              Teacher Dashboard
            </span>
          </div>
        </div>

      
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>

        <Footer />
      </div>

     
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </div>
  );
}
