import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { AuthAPI, auth } from "../../firebase/firebase.js";
import {
  User,
  Lock,
  UserCheck,
  UserPlus,
  ShieldCheck,
  CheckSquare,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setDemoUser } = useAuth();

  const adminDemo = { email: "a@gmail.com", password: "123" };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (role === "admin") {
      if (email === adminDemo.email && password === adminDemo.password) {
        setDemoUser("admin");
        navigate("/admin");
      } else {
        setError("Invalid admin credentials.");
      }
    } else {
      try {
        await AuthAPI.signInWithEmailAndPassword(auth, email, password);
        setDemoUser(role);
        if (role === "teacher") navigate("/teacher");
        else navigate("/student");
      } catch (err) {
        if (
          err.code === "auth/user-not-found" ||
          err.code === "auth/wrong-password"
        ) {
          setError("Invalid email or password.");
        } else if (err.code === "auth/invalid-email") {
          setError("Invalid email format.");
        } else {
          setError("Login error: " + err.message);
        }
      }
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-4">
      {/* Branding Header */}
      <div className="flex items-center mb-6">
        <div className="bg-blue-600 text-white rounded-full p-3 shadow-lg">
          <CheckSquare size={28} />
        </div>
        <h1 className="ml-3 text-3xl font-extrabold text-gray-800">
          Smart Attendance System
        </h1>
      </div>

      {/* Login Card */}
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-sm md:max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-700">
          Welcome Back
        </h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Sign in to manage your attendance records
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Email Input */}
          <div className="flex items-center border rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-400 transition">
            <User className="text-gray-400 mr-2" size={20} />
            <input
              type="email"
              placeholder="Email"
              className="flex-1 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="flex items-center border rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-400 transition">
            <Lock className="text-gray-400 mr-2" size={20} />
            <input
              type="password"
              placeholder="Password"
              className="flex-1 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Role Selection */}
          <div className="flex items-center border rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-400 transition">
            {role === "student" && (
              <UserPlus className="text-gray-400 mr-2" size={20} />
            )}
            {role === "teacher" && (
              <UserCheck className="text-gray-400 mr-2" size={20} />
            )}
            {role === "admin" && (
              <ShieldCheck className="text-gray-400 mr-2" size={20} />
            )}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex-1 outline-none bg-transparent"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-semibold"
          >
            Login
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-600">Demo Credentials:</p>
          <p>
            <strong>Admin:</strong> a@gmail.com / 123
          </p>
          <p>
            <strong>Teacher:</strong> teacher@test.com / teacher123
          </p>
          <p>
            <strong>Student:</strong> student@test.com / student123
          </p>
        </div>
      </div>
    </div>
  );
}
