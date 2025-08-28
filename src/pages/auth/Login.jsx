
// src/pages/auth/Login.jsx
import React, { useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { User, UserCheck, UserPlus, X, CheckSquare } from "lucide-react";
import Footer from "../../components/Footer.jsx";

const roleIcons = {
  student: <User className="w-24 h-24 text-gray-800" />,
  teacher: <UserCheck className="w-24 h-24 text-gray-800" />,
  admin: <UserPlus className="w-24 h-24 text-gray-800" />,
};

// Demo credentials
const demoCredentials = {
  student: { email: "s@gmail.com", password: "123456" },
  teacher: { email: "h@gmail.com", password: "123456" },
  admin: { email: "vinodnangare01@gmail.com", password: "123456" },
};

export default function Login() {
  const [email, setEmail] = useState(demoCredentials.student.email);
  const [password, setPassword] = useState(demoCredentials.student.password);
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Switch role and fill demo credentials
  const handleRoleClick = (r) => {
    setRole(r);
    setEmail(demoCredentials[r].email);
    setPassword(demoCredentials[r].password);
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        setError("User not found in database");
        await signOut(auth);
        return;
      }

      const userData = userDoc.data();
      if (userData.role !== role) {
        setError(`This account is registered as ${userData.role}.`);
        await signOut(auth);
        return;
      }

      if (role === "admin") navigate("/admin");
      else if (role === "teacher") navigate("/teacher");
      else navigate("/student");

      toast.success("Login successful!");
    } catch (err) {
      setError("Invalid email or password.");
      console.error(err);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast.info("Please enter your email.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      toast.success("Password reset email sent!");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (err) {
      toast.error("Error sending reset email: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />

      {/* Navbar */}
      <nav className="bg-black text-white p-4 flex justify-between items-center shadow-lg relative">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-8 h-8 text-white" />
          <span className="font-bold text-lg">Smart Attendance</span>
        </div>

        {/* Desktop Role Buttons */}
        <div className="hidden md:flex gap-6">
          {["student", "teacher", "admin"].map((r) => (
            <button
              key={r}
              className={`px-4 py-2 rounded-lg font-semibold transition-all transform ${
                role === r ? "bg-white text-black shadow-lg scale-105" : "hover:bg-gray-800/70 hover:scale-105"
              }`}
              onClick={() => handleRoleClick(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <button
            className="focus:outline-none cursor-pointer"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {mobileMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow-lg flex flex-col z-50">
              {["student", "teacher", "admin"].map((r) => (
                <button
                  key={r}
                  className={`px-4 py-2 text-left hover:bg-gray-200 transition-colors ${
                    role === r ? "font-bold bg-gray-100" : ""
                  }`}
                  onClick={() => {
                    handleRoleClick(r);
                    setMobileMenuOpen(false);
                  }}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 w-full max-w-md mx-auto">

        {/* Demo Credentials Info */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md text-gray-700 text-sm w-full border border-gray-300">
          <p className="font-semibold mb-1">Demo Credentials:</p>
          <p>Student: s@gmail.com / 123456</p>
          <p>Teacher: h@gmail.com / 123456</p>
          <p>Admin: vinodnangare01@gmail.com / 123456</p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="mb-6 flex flex-col items-center">
            {roleIcons[role]}
            <p className="mt-2 text-gray-800 font-semibold text-lg capitalize">{role}</p>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 drop-shadow-md">
            Login as {role.charAt(0).toUpperCase() + role.slice(1)}
          </h2>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 shadow-inner"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 shadow-inner"
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-gray-900 to-black text-white py-2 rounded-xl font-semibold hover:scale-105 hover:shadow-lg transition-transform cursor-pointer"
            >
              Login
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setShowForgotModal(true)}
              className="text-black underline text-sm hover:text-gray-700 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-11/12 max-w-sm shadow-2xl relative transform hover:scale-105 transition-all duration-300">
                       <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              onClick={() => setShowForgotModal(false)}
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold mb-3">Reset Password</h3>
            <p className="text-gray-600 mb-4">
              Enter your email to receive a password reset link.
            </p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-800"
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition cursor-pointer"
                onClick={() => setShowForgotModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900 transition cursor-pointer"
                onClick={handleForgotPassword}
              >
                Send Link
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
