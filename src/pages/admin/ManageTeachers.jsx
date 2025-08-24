
import React, { useEffect, useMemo, useState } from "react";
import { db, secondaryAuth, DB } from "../../firebase/firebase.js";
import { setDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  PlusCircle,
  Pencil,
  Save,
  Trash2,
  X,
  GraduationCap,
  Search,
} from "lucide-react";

export default function ManageTeachers() {
  const [list, setList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    classId: "",
    subject: "",
    password: "",
  });

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    classId: "",
    subject: "",
  });

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filter, setFilter] = useState("");

  const classMap = useMemo(() => {
    const map = {};
    classes.forEach((c) => (map[c.id] = c));
    return map;
  }, [classes]);

  const subjectOptions = useMemo(() => classMap[form.classId]?.subjects || [], [
    classMap,
    form.classId,
  ]);

  const editSubjectOptions = useMemo(
    () => classMap[editForm.classId]?.subjects || [],
    [classMap, editForm.classId]
  );

  async function load() {
    setLoading(true);
    try {
      const clsSnap = await DB.getDocs(DB.collection(db, "classes"));
      setClasses(clsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const snap = await DB.getDocs(
        DB.query(DB.collection(db, "users"), DB.where("role", "==", "teacher"))
      );
      setList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      toast.error("Failed to load data: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ✅ Add teacher using secondaryAuth
  async function addTeacher(e) {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.classId ||
      !form.subject ||
      !form.password
    ) {
      toast.info("Please fill all fields");
      return;
    }
    try {
      // Create user with secondary auth
      const userCred = await createUserWithEmailAndPassword(
        secondaryAuth,
        form.email.trim(),
        form.password
      );

      const userId = userCred.user.uid;
      await setDoc(doc(db, "users", userId), {
        name: form.name.trim(),
        email: form.email.trim(),
        classId: form.classId,
        subject: form.subject,
        role: "teacher",
      });

      toast.success("Teacher created");
      setForm({
        name: "",
        email: "",
        classId: "",
        subject: "",
        password: "",
      });
      await load();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        toast.error("This email is already in use.");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Invalid email address.");
      } else if (err.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters.");
      } else {
        toast.error("Error creating teacher: " + err.message);
      }
    }
  }

  function startEdit(t) {
    setEditId(t.id);
    setEditForm({
      name: t.name || "",
      classId: t.classId || "",
      subject: t.subject || "",
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "users", editId), {
        name: editForm.name.trim(),
        classId: editForm.classId,
        subject: editForm.subject,
      });
      toast.success("Teacher updated");
      setEditId(null);
      setEditForm({ name: "", classId: "", subject: "" });
      await load();
    } catch (e) {
      toast.error("Update failed: " + e.message);
    }
  }

  async function confirmDeleteTeacher() {
    try {
      await deleteDoc(doc(db, "users", confirmDelete.id));
      toast.success(`Teacher "${confirmDelete.name}" deleted`);
      setConfirmDelete(null);
      await load();
    } catch (e) {
      toast.error("Delete failed: " + e.message);
    }
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        (t.name || "").toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q) ||
        (t.classId || "").toLowerCase().includes(q) ||
        (t.subject || "").toLowerCase().includes(q)
    );
  }, [list, filter]);

  return (
    <div className="px-6 py-6">
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      <h1 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <GraduationCap size={22} /> Manage Teachers
      </h1>

      {/* Create teacher form */}
      <form
        onSubmit={addTeacher}
        className="bg-white rounded-xl p-4 shadow border mb-4 grid grid-cols-1 md:grid-cols-6 gap-3"
      >
        <input
          className="border rounded-md px-3 py-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="border rounded-md px-3 py-2"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <select
          className="border rounded-md px-3 py-2"
          value={form.classId}
          onChange={(e) =>
            setForm({ ...form, classId: e.target.value, subject: "" })
          }
        >
          <option value="">Select Class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} — {c.name}
            </option>
          ))}
        </select>
        <select
          className="border rounded-md px-3 py-2"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          disabled={!form.classId}
        >
          <option value="">
            {form.classId ? "Select Subject" : "Select a class first"}
          </option>
          {subjectOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          className="border rounded-md px-3 py-2"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            className="pl-10 pr-3 py-2 w-full border rounded-md"
            placeholder="Search teacher/class/subject…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <button className="md:col-span-6 px-4 py-2 rounded-md bg-gray-900 text-white flex items-center justify-center gap-2">
          <PlusCircle size={18} /> Add Teacher
        </button>
      </form>

      {/* Teacher list */}
      <div className="bg-white rounded-xl p-4 shadow border">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 border-b-2"></div>
            <span className="ml-3 text-lg text-gray-600">Loading…</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Class</th>
                <th>Subject</th>
                <th className="w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="py-2">
                    {editId === t.id ? (
                      <input
                        className="border rounded-md px-2 py-1"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    ) : (
                      t.name || "-"
                    )}
                  </td>
                  <td>{t.email}</td>
                  <td>
                    {editId === t.id ? (
                      <select
                        className="border rounded-md px-2 py-1"
                        value={editForm.classId}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            classId: e.target.value,
                            subject: "",
                          })
                        }
                      >
                        <option value="">Select Class</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.id} — {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      t.classId || "-"
                    )}
                  </td>
                  <td>
                    {editId === t.id ? (
                      <select
                        className="border rounded-md px-2 py-1"
                        value={editForm.subject}
                        onChange={(e) =>
                          setEditForm({ ...editForm, subject: e.target.value })
                        }
                        disabled={!editForm.classId}
                      >
                        <option value="">
                          {editForm.classId
                            ? "Select Subject"
                            : "Select a class first"}
                        </option>
                        {editSubjectOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      t.subject || "-"
                    )}
                  </td>
                  <td>
                    {editId === t.id ? (
                      <div className="flex gap-2">
                        <button
                          className="px-2 py-1 bg-green-600 text-white rounded flex items-center gap-1"
                          onClick={saveEdit}
                        >
                          <Save size={16} /> Save
                        </button>
                        <button
                          className="px-2 py-1 bg-gray-200 rounded flex items-center gap-1"
                          onClick={() => {
                            setEditId(null);
                            setEditForm({ name: "", classId: "", subject: "" });
                          }}
                        >
                          <X size={16} /> Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          className="px-2 py-1 bg-blue-600 text-white rounded flex items-center gap-1"
                          onClick={() => startEdit(t)}
                        >
                          <Pencil size={16} /> Edit
                        </button>
                        <button
                          className="px-2 py-1 bg-red-600 text-white rounded flex items-center gap-1"
                          onClick={() =>
                            setConfirmDelete({ id: t.id, name: t.name })
                          }
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-6">
                    No teachers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
              <p className="text-xs text-gray-500 mt-3">
          Tip: Subject options depend on the selected class. Add subjects in the
          “Manage Classes & Subjects” page.
        </p>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Delete Teacher</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{confirmDelete.name}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white"
                onClick={confirmDeleteTeacher}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
