import React, { useEffect, useMemo, useState } from "react";
import { db, DB } from "../../firebase/firebase.js";
import toast, { Toaster } from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ManageAttendance() {
  // Filters
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Data
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);

  // UI
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [loading, setLoading] = useState(false);

  // Load classes once
  useEffect(() => {
    (async () => {
      const snap = await DB.getDocs(DB.collection(db, "classes"));
      setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  // Load teachers for class
  useEffect(() => {
    (async () => {
      if (!selectedClass) {
        setTeachers([]);
        setSelectedTeacher("all");
        return;
      }
      const snap = await DB.getDocs(
        DB.query(
          DB.collection(db, "users"),
          DB.where("role", "==", "teacher"),
          DB.where("classId", "==", selectedClass)
        )
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTeachers(list);
      setSelectedTeacher("all");
    })();
  }, [selectedClass]);

  // Load subjects dynamically for teacher
  useEffect(() => {
    (async () => {
      if (!selectedClass || selectedTeacher === "all") {
        setSubjects([]);
        setSelectedSubject("all");
        return;
      }
      const snap = await DB.getDocs(
        DB.query(
          DB.collection(db, "subjects"),
          DB.where("classId", "==", selectedClass),
          DB.where("teacherId", "==", selectedTeacher)
        )
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSubjects(list);
      setSelectedSubject(list.length > 0 ? list[0].name : "all"); // auto-select
    })();
  }, [selectedClass, selectedTeacher]);

  // Load students
  useEffect(() => {
    (async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }
      const snap = await DB.getDocs(
        DB.query(
          DB.collection(db, "users"),
          DB.where("role", "==", "student"),
          DB.where("classId", "==", selectedClass)
        )
      );
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, [selectedClass]);

  // Load attendance records
  useEffect(() => {
    (async () => {
      if (!selectedClass) {
        setRecords([]);
        return;
      }
      setLoading(true);
      try {
        const snap = await DB.getDocs(DB.collection(db, "attendance"));
        let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Filter by class
        list = list.filter((x) => x.classId === selectedClass);

        // Teacher filter (if not "all")
        if (selectedTeacher !== "all")
          list = list.filter((x) => x.teacherId === selectedTeacher);

        // Subject filter (if not "all")
        if (selectedSubject !== "all")
          list = list.filter((x) => x.subject === selectedSubject);

        // Date filters
        if (fromDate) list = list.filter((x) => x.date >= fromDate);
        if (toDate) list = list.filter((x) => x.date <= toDate);

        list.sort((a, b) => (a.date > b.date ? -1 : 1));
        setRecords(list);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load attendance records.");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClass, selectedTeacher, selectedSubject, fromDate, toDate]);

  // Build summary
  const summaryRows = useMemo(() => {
    const totalLectures = records.length;
    const rows = students.map((s) => {
      let present = 0;
      for (const rec of records) {
        const status = rec.students?.[s.id];
        if (status === "present") present++;
      }
      const percent = totalLectures > 0 ? (present / totalLectures) * 100 : 0;
      return {
        id: s.id,
        name: s.name || "-",
        rollNo: s.rollNo || "",
        present,
        total: totalLectures,
        percent,
      };
    });

    const q = search.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            String(r.rollNo).toLowerCase().includes(q)
        )
      : rows;

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "present") cmp = a.present - b.present;
      else if (sortBy === "total") cmp = a.total - b.total;
      else if (sortBy === "percent") cmp = a.percent - b.percent;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return { rows: sorted, totalLectures };
  }, [students, records, search, sortBy, sortDir]);

  function toggleSort(nextKey) {
    if (sortBy === nextKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(nextKey);
      setSortDir("asc");
    }
  }

  // Pie Chart Data
  const pieData = useMemo(() => {
    const totalLectures = summaryRows.totalLectures;
    let totalPresent = 0;
    summaryRows.rows.forEach((r) => {
      totalPresent += r.present;
    });
    const totalPossible = totalLectures * students.length;
    const absent = totalPossible - totalPresent;

    return [
      { name: "Present", value: totalPresent },
      { name: "Absent", value: absent },
    ];
  }, [summaryRows, students]);

  const COLORS = ["#4ade80", "#f87171"]; // green, red

  return (
    <div>
      <Toaster position="top-right" />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">📊 Attendance Summary</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow border mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Class */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1">Class</label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedTeacher("all");
                setSelectedSubject("all");
              }}
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1">Teacher</label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="all">All Teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1">Subject</label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-full"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-full"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      {selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-2xl p-4 shadow border">
            <h2 className="text-lg font-semibold mb-2">Per Student Attendance %</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summaryRows.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percent" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-2xl p-4 shadow border">
            <h2 className="text-lg font-semibold mb-2">Overall Attendance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Table */}
      <div className="bg-white rounded-2xl p-4 shadow border">
        {!selectedClass ? (
          <p className="text-gray-500">Please select a class to view attendance.</p>
        ) : students.length === 0 ? (
          <p className="text-gray-500">No students found for this class.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th onClick={() => toggleSort("name")} className="cursor-pointer">Student</th>
                  <th onClick={() => toggleSort("total")} className="cursor-pointer">Total</th>
                  <th onClick={() => toggleSort("present")} className="cursor-pointer">Present</th>
                  <th onClick={() => toggleSort("percent")} className="cursor-pointer">%</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="py-2">{r.name} ({r.rollNo})</td>
                    <td>{r.total}</td>
                    <td>{r.present}</td>
                    <td>{r.percent.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
