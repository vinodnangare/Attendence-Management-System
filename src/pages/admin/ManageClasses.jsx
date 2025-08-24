import React, { useEffect, useMemo, useState } from "react";
import { db, DB } from "../../firebase/firebase.js";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  PlusCircle,
  Pencil,
  Save,
  Trash2,
  X,
  Search,
  BookOpen,
  Layers,
} from "lucide-react";

export default function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create class form
  const [form, setForm] = useState({ id: "", name: "" });

  // Edit class inline
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  // Per-class subject input
  const [subjectInput, setSubjectInput] = useState({}); // { [classId]: "Subject Name" }

  // Search filter
  const [filter, setFilter] = useState("");

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(null); // {id, name}

  async function load() {
    setLoading(true);
    try {
      const snap = await DB.getDocs(DB.collection(db, "classes"));
      setClasses(
        snap.docs.map((d) => ({
          id: d.id,
          subjects: [],
          ...d.data(),
        }))
      );
    } catch (e) {
      toast.error("Failed to load classes: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createClass(e) {
    e.preventDefault();
    if (!form.id.trim() || !form.name.trim()) {
      toast.info("Please enter Class ID and Class Name");
      return;
    }
    try {
      await setDoc(doc(db, "classes", form.id.trim()), {
        name: form.name.trim(),
        subjects: [],
      });
      toast.success("Class created");
      setForm({ id: "", name: "" });
      await load();
    } catch (e) {
      toast.error("Create failed: " + e.message);
    }
  }

  function startEdit(c) {
    setEditId(c.id);
    setEditName(c.name || "");
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "classes", editId), { name: editName.trim() });
      toast.success("Class name updated");
      setEditId(null);
      setEditName("");
      await load();
    } catch (e) {
      toast.error("Update failed: " + e.message);
    }
  }

  async function addSubject(classId) {
    const val = (subjectInput[classId] || "").trim();
    if (!val) {
      toast.info("Enter a subject name first");
      return;
    }
    try {
      const cls = classes.find((c) => c.id === classId);
      const next = Array.from(new Set([...(cls.subjects || []), val]));
      await updateDoc(doc(db, "classes", classId), { subjects: next });
      setSubjectInput((s) => ({ ...s, [classId]: "" }));
      toast.success("Subject added");
      await load();
    } catch (e) {
      toast.error("Failed to add subject: " + e.message);
    }
  }

  async function removeSubject(classId, subject) {
    try {
      const cls = classes.find((c) => c.id === classId);
      const next = (cls.subjects || []).filter((s) => s !== subject);
      await updateDoc(doc(db, "classes", classId), { subjects: next });
      toast.success("Subject removed");
      await load();
    } catch (e) {
      toast.error("Failed to remove subject: " + e.message);
    }
  }

  async function confirmDeleteClass() {
    try {
      await deleteDoc(doc(db, "classes", confirmDelete.id));
      toast.success(`Class "${confirmDelete.name}" deleted`);
      setConfirmDelete(null);
      await load();
    } catch (e) {
      toast.error("Delete failed: " + e.message);
    }
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        (c.name || "").toLowerCase().includes(q) ||
        (c.subjects || []).some((s) => s.toLowerCase().includes(q))
    );
  }, [classes, filter]);

  return (
    <div className="px-6 py-6">
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      <h1 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <Layers size={22} />
        Manage Classes & Subjects
      </h1>

      {/* Create class */}
      <form
        onSubmit={createClass}
        className="bg-white rounded-xl p-4 shadow border mb-4 grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        <input
          className="border rounded-md px-3 py-2"
          placeholder="Class ID (e.g., FY / SY / TY / BTECH / IT-3A)"
          value={form.id}
          onChange={(e) => setForm({ ...form, id: e.target.value })}
        />
        <input
          className="border rounded-md px-3 py-2"
          placeholder="Class Name (e.g., First Year)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <button className="px-4 py-2 rounded-md bg-gray-900 text-white flex items-center justify-center gap-2">
          <PlusCircle size={18} /> Add Class
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            className="pl-10 pr-3 py-2 w-full border rounded-md"
            placeholder="Search class or subject…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl p-4 shadow border">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 border-b-2"></div>
            <span className="ml-3 text-lg text-gray-600">Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No classes found</div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="border p-4 rounded-md hover:shadow transition"
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <BookOpen className="text-blue-700" size={18} />
                    </div>
                    <div>
                      {editId === c.id ? (
                        <form onSubmit={saveEdit} className="flex items-center gap-2">
                          <input
                            className="border rounded-md px-2 py-1"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <button className="px-2 py-1 bg-green-600 text-white rounded flex items-center gap-1">
                            <Save size={16} /> Save
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 bg-gray-200 rounded flex items-center gap-1"
                            onClick={() => {
                              setEditId(null);
                              setEditName("");
                            }}
                          >
                            <X size={16} /> Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="font-semibold text-gray-800">
                            {c.id} — {c.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {c.subjects?.length || 0} subjects
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {editId !== c.id && (
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 bg-blue-600 text-white rounded flex items-center gap-1"
                        onClick={() => startEdit(c)}
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      <button
                        className="px-2 py-1 bg-red-600 text-white rounded flex items-center gap-1"
                        onClick={() => setConfirmDelete({ id: c.id, name: c.name })}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Subjects */}
                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Subjects
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(c.subjects || []).map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {s}
                        <button
                          className="hover:text-red-600"
                          onClick={() => removeSubject(c.id, s)}
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                    {(!c.subjects || c.subjects.length === 0) && (
                      <span className="text-xs text-gray-400">No subjects yet</span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <input
                      className="border rounded-md px-3 py-2 w-full sm:w-72"
                      placeholder="Add new subject"
                      value={subjectInput[c.id] || ""}
                      onChange={(e) =>
                        setSubjectInput((m) => ({ ...m, [c.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSubject(c.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => addSubject(c.id)}
                      className="px-4 py-2 rounded-md bg-gray-900 text-white flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <PlusCircle size={18} /> Add Subject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Delete Class</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete class{" "}
              <span className="font-semibold">{confirmDelete.name}</span>? This action
              cannot be undone.
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
                onClick={confirmDeleteClass}
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
