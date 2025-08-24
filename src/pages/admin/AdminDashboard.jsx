// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebase/firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Users, GraduationCap, BookOpen, Search } from "lucide-react";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]); // all users
  const [classes, setClasses] = useState([]); // all classes
  const [loading, setLoading] = useState(true);
  const [teacherFilter, setTeacherFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [activeClass, setActiveClass] = useState("FY");
  const [error, setError] = useState("");

  // realtime listeners for users and classes
  useEffect(() => {
    setLoading(true);
    const qTeachers = query(collection(db, "users"), where("role", "==", "teacher"));
    const qStudents = query(collection(db, "users"), where("role", "==", "student"));
    const qClasses = query(collection(db, "classes"), orderBy("name"));

    // note: we'll merge teachers & students into users array with role field for convenience
    const unsubTeachers = onSnapshot(
      qTeachers,
      (snap) => {
        const t = snap.docs.map((d) => ({ id: d.id, role: "teacher", ...d.data() }));
        setUsers((prev) => {
          const others = prev.filter((u) => u.role !== "teacher");
          return [...others, ...t];
        });
        setLoading(false);
      },
      (err) => {
        setError("Failed to listen teachers: " + err.message);
        setLoading(false);
      }
    );

    const unsubStudents = onSnapshot(
      qStudents,
      (snap) => {
        const s = snap.docs.map((d) => ({ id: d.id, role: "student", ...d.data() }));
        setUsers((prev) => {
          const others = prev.filter((u) => u.role !== "student");
          return [...others, ...s];
        });
        setLoading(false);
      },
      (err) => {
        setError("Failed to listen students: " + err.message);
        setLoading(false);
      }
    );

    const unsubClasses = onSnapshot(
      qClasses,
      (snap) => {
        const cls = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setClasses(cls);
        setLoading(false);
      },
      (err) => {
        setError("Failed to listen classes: " + err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubTeachers();
      unsubStudents();
      unsubClasses();
    };
  }, []);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const stats = useMemo(() => {
    const teachers = users.filter((u) => u.role === "teacher").length;
    const students = users.filter((u) => u.role === "student").length;
    const classesCount = classes.length;
    return { teachers, students, classes: classesCount };
  }, [users, classes]);

  // Build grouped classData (teachers & students per class)
  const classData = useMemo(() => {
    // build a map of classes keys from classes collection
    const map = {};
    // initialize keys from classes collection to show empty groups too
    classes.forEach((c) => {
      map[c.id] = { teachers: [], students: [], meta: c };
    });

    // also ensure common class keys (FY SY ...) exist if not present in classes collection
    ["FY", "SY", "TY", "BTECH"].forEach((k) => {
      if (!map[k]) map[k] = { teachers: [], students: [], meta: { id: k, name: k } };
    });

    users.forEach((u) => {
      const cid = u.classId || "UNKNOWN";
      if (!map[cid]) map[cid] = { teachers: [], students: [], meta: { id: cid, name: cid } };
      if (u.role === "teacher") map[cid].teachers.push(u);
      if (u.role === "student") map[cid].students.push(u);
    });

    return map;
  }, [users, classes]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 border-b-2"></div>
        <span className="ml-3 text-lg text-gray-600">Loading dashboard...</span>
      </div>
    );

  // Example toasts (you can wire actual handlers)
  const handleAdd = () => toast.success("Added successfully!");
  const handleEdit = () => toast.info("Edited successfully!");

  // recent classes for quick glance - newest by createdAt if available
  const recentClasses = [...classes]
    .sort((a, b) => {
      const ta = a.createdAt ? a.createdAt.toMillis?.() ?? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? b.createdAt.toMillis?.() ?? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 5);

  return (
    <div className="px-6 py-6">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="colored" />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      <div className="flex gap-2 mb-4">
        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleAdd}>Add</button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleEdit}>Edit</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
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
          <Link to="/admin/teachers" className="mb-2 bg-blue-600 text-white py-1.5 rounded-md hover:bg-blue-700">Manage Teachers</Link>
          <Link to="/admin/students" className="mb-2 bg-blue-600 text-white py-1.5 rounded-md hover:bg-blue-700">Manage Students</Link>
          <Link to="/admin/classes" className="mb-2 bg-blue-600 text-white py-1.5 rounded-md hover:bg-blue-700">Manage Classes</Link>
          <Link to="/admin/attendance" className="bg-blue-600 text-white py-1.5 rounded-md hover:bg-blue-700">Manage Attendance</Link>
        </div>
      </div>

      {/* Class Tabs */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {Object.keys(classData).map((cls) => (
          <button
            key={cls}
            className={`px-5 py-2 rounded-full font-semibold transition-all duration-200 ${
              activeClass === cls ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-blue-100"
            }`}
            onClick={() => setActiveClass(cls)}
          >
            {cls} ({classData[cls].students.length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teachers + Students (main) */}
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-md border">
          {/* Teachers */}
          <h2 className="text-xl font-semibold mb-3">Teachers ({activeClass})</h2>
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
                    <tr key={t.id} className="border-t hover:bg-blue-50 transition">
                      <td className="py-2 px-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                          {t.name?.[0]?.toUpperCase()}
                        </div>
                        {t.name}
                      </td>
                      <td>{t.email}</td>
                      <td>{t.subject || "—"}</td>
                    </tr>
                  ))}
                {classData[activeClass].teachers.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-3">No teachers found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Students */}
          <h2 className="text-xl font-semibold mt-8 mb-3">Students ({activeClass})</h2>
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
                      (s.rollNo || "").toString().includes(studentFilter.toLowerCase())
                  )
                  .map((s) => (
                    <tr key={s.id} className="border-t hover:bg-blue-50 transition">
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
                  <tr><td colSpan={3} className="text-center text-gray-400 py-3">No students found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Quick class info & recent */}
        <div className="bg-white rounded-xl p-6 shadow-md border">
          <h3 className="text-lg font-semibold mb-3">Class Overview</h3>
          <ul className="space-y-2 mb-4">
            {Object.keys(classData).map((k) => (
              <li key={k} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{k}</div>
                  <div className="text-xs text-gray-500">
                    {classData[k].teachers.length} teachers • {classData[k].students.length} students
                  </div>
                </div>
                <div>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm" onClick={() => setActiveClass(k)}>View</button>
                </div>
              </li>
            ))}
          </ul>

          <h4 className="text-md font-semibold mb-2">Recent Classes</h4>
          <div className="space-y-2">
            {recentClasses.length === 0 && <div className="text-sm text-gray-400">No classes yet</div>}
            {recentClasses.map((c) => (
              <div key={c.id} className="p-3 border rounded-md flex justify-between items-center">
                <div>
                  <div className="font-medium">{c.id} — {c.name}</div>
                  <div className="text-xs text-gray-500">{(c.subjects?.length || 0) + " subjects"}</div>
                </div>
                <Link to="/admin/classes" className="text-sm text-blue-600">Manage</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
