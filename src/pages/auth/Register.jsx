import React, { useState } from "react";
import { AuthAPI, auth, db } from "../../firebase/firebase.js";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";


export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    classId: "",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await AuthAPI.createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      if (form.name) await AuthAPI.updateProfile(res.user, { displayName: form.name });
      await setDoc(doc(db, "users", res.user.uid), {
        name: form.name || "",
        email: form.email,
        role: form.role,      
        classId: form.classId || null,
        createdAt: Date.now(),
      });
      navigate("/");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white p-6 rounded-2xl shadow"
      >
        <h1 className="text-xl font-semibold mb-4">Register (Demo)</h1>
        <div className="space-y-3">
          <input className="w-full border rounded-md px-3 py-2"
                 placeholder="Full name" name="name" value={form.name} onChange={change}/>
          <input className="w-full border rounded-md px-3 py-2"
                 placeholder="Email" name="email" type="email" value={form.email} onChange={change}/>
          <input className="w-full border rounded-md px-3 py-2"
                 placeholder="Password" name="password" type="password" value={form.password} onChange={change}/>
          <select name="role" value={form.role} onChange={change}
                  className="w-full border rounded-md px-3 py-2">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <input className="w-full border rounded-md px-3 py-2"
                 placeholder="Class ID (e.g., IT-3A)" name="classId" value={form.classId} onChange={change}/>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button disabled={loading}
                  className="w-full bg-gray-900 text-white rounded-md py-2">
            {loading ? "Creating..." : "Create Account"}
          </button>
          <p className="text-sm text-gray-600">
            Have an account? <Link className="text-gray-900" to="/">Login</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
