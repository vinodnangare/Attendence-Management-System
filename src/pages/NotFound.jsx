import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center text-center">
      <div>
        <h1 className="text-3xl font-bold mb-2">404</h1>
        <p className="text-gray-600 mb-4">Page not found.</p>
        <Link className="px-4 py-2 rounded-md bg-gray-900 text-white" to="/">Go home</Link>
      </div>
    </div>
  );
}
