import React from "react";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center text-sm text-gray-500">
        © {new Date().getFullYear()} Smart Attendance System
      </div>
    </footer>
  );
}
