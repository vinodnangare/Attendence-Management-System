import React, { useEffect, useMemo, useState } from "react";
import { db, DB, AuthAPI, auth, secondaryAuth } from "../../firebase/firebase.js";
import {
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";

export default function ManageStudents() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [classes, setClasses] = useState([]);

  // add form
  const [form, setForm] = useState({
    name: "",
    email: "",
    classId: "",
    rollNo: "",
    password: "",
    gender: "male", 
  });

  // edit state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    classId: "",
    rollNo: "",
    gender: "male",
  });

  // UI helpers
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  // Load students
  async function load() {
    setLoading(true);
    const snap = await DB.getDocs(
      DB.query(DB.collection(db, "users"), DB.where("role", "==", "student"))
    );
    setList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  // Load classes
  async function loadClasses() {
    try {
      const snap = await getDocs(collection(db, "classes"));
      setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error("Failed to load classes");
    }
  }

  useEffect(() => {
    load();
    loadClasses();
  }, []);

  function isRollUnique(classId, rollNo, excludeId = null) {
    return !list.some(
      (s) =>
        s.classId === classId &&
        String(s.rollNo).trim() === String(rollNo).trim() &&
        (excludeId ? s.id !== excludeId : true)
    );
  }

  // Add student
  async function addStudent(e) {
    e.preventDefault();
    const { name, email, classId, rollNo, password, gender } = form;

    if (!name || !email || !classId || !rollNo || !password || !gender) {
      toast.error("All fields are required.");
      return;
    }

    if (!isRollUnique(classId, rollNo)) {
      toast.error(`Roll number ${rollNo} already exists in this class`);
      return;
    }

    try {
      // 👉 use secondaryAuth so admin session is safe
      const userCred = await AuthAPI.createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      const userId = userCred.user.uid;

      await setDoc(doc(db, "users", userId), {
        name,
        email,
        classId,
        rollNo,
        role: "student",
        gender,
      });

      // sign out from secondary app
      await secondaryAuth.signOut();

      setForm({
        name: "",
        email: "",
        classId: "",
        rollNo: "",
        password: "",
        gender: "male",
      });

      toast.success("Student added successfully!");
      await load();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        toast.error("This email is already in use.");
      } else {
        toast.error("Error: " + err.message);
      }
    }
  }

  // Start edit
  function startEdit(s) {
    setEditId(s.id);
    setEditForm({
      name: s.name || "",
      classId: s.classId || "",
      rollNo: s.rollNo || "",
      gender: s.gender || "male",
    });
  }

  // Save edit
  async function saveEdit() {
    const { name, classId, rollNo, gender } = editForm;

    if (!name || !classId || !rollNo || !gender) {
      toast.error("All fields are required.");
      return;
    }
    if (!isRollUnique(classId, rollNo, editId)) {
      toast.error(`Roll number ${rollNo} already exists in this class`);
      return;
    }

    await updateDoc(doc(db, "users", editId), {
      name,
      classId,
      rollNo,
      gender,
    });

    setEditId(null);
    setEditForm({ name: "", classId: "", rollNo: "", gender: "male" });
    toast.success("Student updated!");
    await load();
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ name: "", classId: "", rollNo: "", gender: "male" });
  }

  async function deleteStudent(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this student?"
    );
    if (!confirmDelete) return;
    await deleteDoc(doc(db, "users", id));
    toast.success("Student deleted!");
    await load();
  }

  // Avatars
  function GenderAvatar({ gender, name }) {
    const initials = String(name || "?")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const isMale = (gender || "male").toLowerCase() === "male";
    const bg = isMale ? "bg-blue-100 border-blue-300" : "bg-pink-100 border-pink-300";
    const fg = isMale ? "text-blue-700" : "text-pink-700";

    return (
      <div
        className={`h-10 w-10 rounded-full border flex items-center justify-center overflow-hidden ${bg}`}
        title={gender || "male"}
      >
        <span className={`font-bold ${fg}`}>{initials}</span>
      </div>
    );
  }

  // Derived data (search, filter, sort)
  const classMap = useMemo(() => {
    const m = new Map();
    classes.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [classes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let rows = list.map((s) => ({
      ...s,
      className: classMap.get(s.classId) || "-",
      gender: s.gender || "male",
    }));

    if (classFilter !== "all") {
      rows = rows.filter((r) => r.classId === classFilter);
    }
    if (q) {
      rows = rows.filter(
        (r) =>
          (r.name || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          String(r.rollNo || "").toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = (a.name || "").localeCompare(b.name || "");
      else if (sortBy === "roll")
        cmp = String(a.rollNo || "").localeCompare(String(b.rollNo || ""));
      else if (sortBy === "class") cmp = a.className.localeCompare(b.className);
      else if (sortBy === "gender") cmp = (a.gender || "").localeCompare(b.gender || "");

      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [list, classMap, search, classFilter, sortBy, sortDir]);

  function toggleSort(key) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  }

  return (
    <div>
      <Toaster position="top-right" />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Students</h1>
        <div className="text-xs text-gray-500">
          Create, edit and organize students by class, roll, and gender.
        </div>
      </div>

      {/* Add student form */}
      <form
        onSubmit={addStudent}
        className="bg-white rounded-2xl p-4 shadow border mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={form.classId}
          onChange={(e) => setForm({ ...form, classId: e.target.value })}
        >
          <option value="">Select Class</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Roll No"
          value={form.rollNo}
          onChange={(e) => setForm({ ...form, rollNo: e.target.value })}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
        >
          <option value="male">Gender: Male</option>
          <option value="female">Gender: Female</option>
        </select>
        <div className="flex gap-2">
          <input
            className="border rounded-lg px-3 py-2 flex-1"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700">
            Add
          </button>
        </div>
      </form>

      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <input
            className="border rounded-lg px-3 py-2 w-64"
            placeholder="Search name, email, or roll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-500">
          Showing <b>{filtered.length}</b> of {list.length} students
        </div>
      </div>

      {/* Student table */}
      <div className="bg-white rounded-2xl p-4 shadow border">
        {loading ? (
          <p className="text-gray-500">Loading students...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">No students match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">Student</th>
                  <th
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("gender")}
                  >
                    Gender {sortBy === "gender" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("class")}
                  >
                    Class {sortBy === "class" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("roll")}
                  >
                    Roll {sortBy === "roll" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const className = classMap.get(s.classId) || "-";
                  const isEditing = editId === s.id;
                  const genderText = (isEditing ? editForm.gender : s.gender || "male")
                    .toString()
                    .toLowerCase();
                  const genderBadge =
                    genderText === "female"
                      ? "bg-pink-50 text-pink-700 border"
                      : "bg-blue-50 text-blue-700 border";

                  return (
                    <tr key={s.id} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="py-2">
                        <div className="flex items-center gap-3">
                          <GenderAvatar gender={s.gender} name={s.name} />
                          <div className="min-w-[12rem]">
                            {isEditing ? (
                              <input
                                className="border rounded-md px-2 py-1 w-full"
                                value={editForm.name}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, name: e.target.value })
                                }
                              />
                            ) : (
                              <div className="font-medium">{s.name || "-"}</div>
                            )}
                            <div className="text-xs text-gray-500">{s.email}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {isEditing ? (
                          <select
                            className="border rounded-md px-2 py-1"
                            value={editForm.gender}
                            onChange={(e) =>
                              setEditForm({ ...editForm, gender: e.target.value })
                            }
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full ${genderBadge}`}>
                            {genderText.charAt(0).toUpperCase() + genderText.slice(1)}
                          </span>
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <select
                            className="border rounded-md px-2 py-1"
                            value={editForm.classId}
                            onChange={(e) =>
                              setEditForm({ ...editForm, classId: e.target.value })
                            }
                          >
                            <option value="">Select Class</option>
                            {classes.map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          className
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            className="border rounded-md px-2 py-1 w-24"
                            value={editForm.rollNo}
                            onChange={(e) =>
                              setEditForm({ ...editForm, rollNo: e.target.value })
                            }
                          />
                        ) : (
                          s.rollNo || "-"
                        )}
                      </td>

                      <td className="whitespace-nowrap">
                        {isEditing ? (
                          <>
                            <button
                              className="px-2 py-1 bg-green-600 text-white rounded mr-2 hover:bg-green-700"
                              onClick={saveEdit}
                            >
                              Save
                            </button>
                            <button
                              className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="px-2 py-1 bg-blue-600 text-white rounded mr-2 hover:bg-blue-700"
                              onClick={() => startEdit(s)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              onClick={() => deleteStudent(s.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t">
                    <td className="py-2 text-sm text-gray-600" colSpan={5}>
                      Total students: <b>{filtered.length}</b>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
