import React, { useEffect, useState } from "react";
import { db, DB, AuthAPI, auth } from "../../firebase/firebase.js";
import { setDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function ManageTeachers() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", classId: "", subject: "", password: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", classId: "", subject: "" });

  async function load() {
    const snap = await DB.getDocs(DB.query(DB.collection(db, "users"), DB.where("role", "==", "teacher")));
    setList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  useEffect(() => { load(); }, []);

  async function addTeacher(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.classId || !form.subject || !form.password) return;
    // Require unique email for each teacher
    try {
      const userCred = await AuthAPI.createUserWithEmailAndPassword(auth, form.email, form.password);
      const userId = userCred.user.uid;
      await setDoc(doc(db, "users", userId), {
        name: form.name,
        email: form.email,
        classId: form.classId,
        subject: form.subject,
        role: "teacher"
      });
      setForm({ name: "", email: "", classId: "", subject: "", password: "" });
      await load();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        alert("Error: This email is already in use. Please use a unique email for each teacher.");
      } else if (err.code === "auth/invalid-email") {
        alert("Error: Invalid email format. Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        alert("Error: Password should be at least 6 characters.");
      } else {
        alert("Error creating teacher: " + err.message);
      }
    }
  }

  function startEdit(t) {
    setEditId(t.id);
    setEditForm({ name: t.name || "", classId: t.classId || "", subject: t.subject || "" });
  }

  async function saveEdit(e) {
    e.preventDefault();
    await updateDoc(doc(db, "users", editId), {
      name: editForm.name,
      classId: editForm.classId,
      subject: editForm.subject
    });
    setEditId(null);
    setEditForm({ name: "", classId: "", subject: "" });
    await load();
  }

  async function deleteTeacher(id) {
    if (!window.confirm("Delete this teacher?")) return;
    await deleteDoc(doc(db, "users", id));
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Manage Teachers</h1>
      <form onSubmit={addTeacher} className="bg-white rounded-xl p-4 shadow border mb-4 flex gap-2 flex-wrap">
        <input className="border rounded-md px-3 py-2" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        <input className="border rounded-md px-3 py-2" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <select className="border rounded-md px-3 py-2" value={form.classId} onChange={e=>setForm({...form, classId:e.target.value})}>
          <option value="">Select Class</option>
          <option value="FY">F.Y</option>
          <option value="SY">S.Y</option>
          <option value="TY">T.Y</option>
          <option value="BTECH">B.Tech</option>
        </select>
        <input className="border rounded-md px-3 py-2" placeholder="Subject" value={form.subject} onChange={e=>setForm({...form, subject:e.target.value})} />
        <input className="border rounded-md px-3 py-2" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        <button className="px-4 py-2 rounded-md bg-gray-900 text-white">Add Teacher</button>
      </form>
      <div className="bg-white rounded-xl p-4 shadow border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2">Name</th><th>Email</th><th>Class</th><th>Subject</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(t => (
              <tr key={t.id} className="border-t">
                <td className="py-2">
                  {editId === t.id ? (
                    <input className="border rounded-md px-2 py-1" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} />
                  ) : t.name || "-"}
                </td>
                <td>{t.email}</td>
                <td>
                  {editId === t.id ? (
                    <input className="border rounded-md px-2 py-1" value={editForm.classId} onChange={e=>setEditForm({...editForm, classId:e.target.value})} />
                  ) : t.classId || "-"}
                </td>
                <td>
                  {editId === t.id ? (
                    <input className="border rounded-md px-2 py-1" value={editForm.subject} onChange={e=>setEditForm({...editForm, subject:e.target.value})} />
                  ) : t.subject || "-"}
                </td>
                <td>
                  {editId === t.id ? (
                    <button className="px-2 py-1 bg-green-600 text-white rounded mr-2" onClick={saveEdit}>Save</button>
                  ) : (
                    <button className="px-2 py-1 bg-blue-600 text-white rounded mr-2" onClick={()=>startEdit(t)}>Edit</button>
                  )}
                  <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=>deleteTeacher(t.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-3">Tip: Use this panel to add, edit, or delete teachers.</p>
      </div>
    </div>
  );
}
