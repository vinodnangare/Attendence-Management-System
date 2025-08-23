import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import { db } from "../../firebase/firebase.js";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Users, GraduationCap, BookOpen, Search } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0 });
  const [activeClass, setActiveClass] = useState("FY");
  const [classData, setClassData] = useState({
    FY: { teachers: [], students: [] },
    SY: { teachers: [], students: [] },
    TY: { teachers: [], students: [] },
    BTECH: { teachers: [], students: [] },
  });
  const [teacherFilter, setTeacherFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const tSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "teacher"))
        );
        const sSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "student"))
        );
        const cSnap = await getDocs(collection(db, "classes"));

        setStats({
          teachers: tSnap.size,
          students: sSnap.size,
          classes: cSnap.size,
        });

        const teachers = tSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const students = sSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const grouped = {
          FY: { teachers: [], students: [] },
          SY: { teachers: [], students: [] },
          TY: { teachers: [], students: [] },
          BTECH: { teachers: [], students: [] },
        };

        teachers.forEach((t) => {
          if (grouped[t.classId]) grouped[t.classId].teachers.push(t);
        });
        students.forEach((s) => {
          if (grouped[s.classId]) grouped[s.classId].students.push(s);
        });

        setClassData(grouped);
        setLoading(false);
      } catch (err) {
        setError("Failed to load dashboard data. " + err.message);
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 border-b-2"></div>
        <span className="ml-3 text-lg text-gray-600">Loading dashboard...</span>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-96 text-red-600 font-bold">
        {error}
      </div>
    );

  // Example handlers for toast notifications
  const handleAdd = () => toast.success("Added successfully!");
  const handleEdit = () => toast.info("Edited successfully!");
  const handleUpdate = () => toast.success("Updated successfully!");
  const handleDelete = () => toast.error("Deleted successfully!");

  return (
    <div className="px-6 py-6">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="colored" />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Admin Dashboard
      </h1>

      {/* Example Action Buttons for Toasts (remove or replace with your actual handlers) */}
      <div className="flex gap-2 mb-4">
        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleAdd}>Add</button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleEdit}>Edit</button>
        <button className="px-3 py-1 bg-purple-600 text-white rounded" onClick={handleUpdate}>Update</button>
        <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={handleDelete}>Delete</button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-md flex items-center gap-4 hover:scale-105 transition">
          <Users size={36} />
          <div>
            <div className="text-sm">Teachers</div>
            <div className="text-3xl font-bold">{stats.teachers}</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 shadow-md flex items-center gap-4 hover:scale-105 transition">
          <GraduationCap size={36} />
          <div>
            <div className="text-sm">Students</div>
            <div className="text-3xl font-bold">{stats.students}</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-md flex items-center gap-4 hover:scale-105 transition">
          <BookOpen size={36} />
          <div>
            <div className="text-sm">Classes</div>
            <div className="text-3xl font-bold">{stats.classes}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow flex flex-col justify-center text-center hover:shadow-lg transition">
          <div className="text-sm text-gray-500 mb-2">Quick Actions</div>
          <Link
            to="/admin/teachers"
            className="mb-2 bg-blue-600 text-white py-1.5 rounded-md hover:bg-blue-700"
          >
            Manage Teachers
          </Link>
          <Link
            to="/admin/students"
            className="mb-2 bg-blue-600 text-white py-1.5 rounded-md hover:bg-blue-700"
          >
            Manage Students
          </Link>
          <Link
            to="/admin/classes"
            className="mb-2 bg-blue-600 text-white py-1.5 rounded-md hover:bg-blue-700"
          >
            Manage Classes
          </Link>
          <Link
            to="/admin/attendance"
            className="bg-blue-600 text-white py-1.5 rounded-md hover:bg-blue-700"
          >
            Manage Attendance
          </Link>
        </div>
      </div>

      {/* Class Tabs */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {["FY", "SY", "TY", "BTECH"].map((cls) => (
          <button
            key={cls}
            className={`px-5 py-2 rounded-full font-semibold transition-all duration-200 ${
              activeClass === cls
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-blue-100"
            }`}
            onClick={() => setActiveClass(cls)}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* Teachers + Students */}
      <div className="bg-white rounded-xl p-6 shadow-md border">
        {/* Teachers */}
        <h2 className="text-xl font-semibold mb-3">
          Teachers ({activeClass})
        </h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            className="pl-10 pr-3 py-2 w-full sm:w-1/2 border rounded-md focus:ring-2 focus:ring-blue-400 text-sm"
            type="text"
            placeholder="Search teachers..."
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-2 px-3">Name</th>
                <th>Email</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              {classData[activeClass].teachers
                .filter(
                  (t) =>
                    t.name?.toLowerCase().includes(teacherFilter.toLowerCase()) ||
                    t.email?.toLowerCase().includes(teacherFilter.toLowerCase()) ||
                    t.subject?.toLowerCase().includes(teacherFilter.toLowerCase())
                )
                .map((t) => (
                  <tr
                    key={t.id}
                    className="border-t hover:bg-blue-50 transition"
                  >
                    <td className="py-2 px-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                        {t.name?.[0]?.toUpperCase()}
                      </div>
                      {t.name}
                    </td>
                    <td>{t.email}</td>
                    <td>{t.subject}</td>
                  </tr>
                ))}
              {classData[activeClass].teachers.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-400 py-3">
                    No teachers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Students */}
        <h2 className="text-xl font-semibold mt-8 mb-3">
          Students ({activeClass})
        </h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            className="pl-10 pr-3 py-2 w-full sm:w-1/2 border rounded-md focus:ring-2 focus:ring-blue-400 text-sm"
            type="text"
            placeholder="Search students..."
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-2 px-3">Roll No</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {classData[activeClass].students
                .filter(
                  (s) =>
                    s.name?.toLowerCase().includes(studentFilter.toLowerCase()) ||
                    s.email?.toLowerCase().includes(studentFilter.toLowerCase()) ||
                    s.rollNo?.toString().includes(studentFilter.toLowerCase())
                )
                .map((s) => (
                  <tr
                    key={s.id}
                    className="border-t hover:bg-blue-50 transition"
                  >
                    <td className="py-2 px-3">{s.rollNo || "—"}</td>
                    <td className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                      {s.name}
                    </td>
                    <td>{s.email}</td>
                  </tr>
                ))}
              {classData[activeClass].students.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-400 py-3">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
