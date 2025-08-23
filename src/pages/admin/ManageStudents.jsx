import React, { useEffect, useState } from "react";
import { db, DB, AuthAPI, auth } from "../../firebase/firebase.js";
import { setDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function ManageStudents() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", classId: "", rollNo: "", password: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", classId: "", rollNo: "" });

  async function load() {
    const snap = await DB.getDocs(DB.query(DB.collection(db, "users"), DB.where("role", "==", "student")));
    setList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  useEffect(() => { load(); }, []);

  async function addStudent(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.classId || !form.rollNo || !form.password) return;
    try {
      const userCred = await AuthAPI.createUserWithEmailAndPassword(auth, form.email, form.password);
      const userId = userCred.user.uid;
      await setDoc(doc(db, "users", userId), {
        name: form.name,
        email: form.email,
        classId: form.classId,
        rollNo: form.rollNo,
        role: "student"
      });
      setForm({ name: "", email: "", classId: "", rollNo: "", password: "" });
      await load();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        alert("Error: This email is already in use. Please use a unique email for each student.");
      } else {
        alert("Error creating student: " + err.message);
      }
    }
  }

  function startEdit(s) {
    setEditId(s.id);
    setEditForm({ name: s.name || "", classId: s.classId || "", rollNo: s.rollNo || "" });
  }

  async function saveEdit(e) {
    e.preventDefault();
    await updateDoc(doc(db, "users", editId), {
      name: editForm.name,
      classId: editForm.classId,
      rollNo: editForm.rollNo
    });
    setEditId(null);
    setEditForm({ name: "", classId: "", rollNo: "" });
    await load();
  }

  async function deleteStudent(id) {
  if (!window.confirm("Delete this student?")) return;
  await deleteDoc(doc(db, "users", id));
  await load();
}

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Manage Students</h1>
      <form onSubmit={addStudent} className="bg-white rounded-xl p-4 shadow border mb-4 flex gap-2 flex-wrap">
        <input className="border rounded-md px-3 py-2" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        <input className="border rounded-md px-3 py-2" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <select className="border rounded-md px-3 py-2" value={form.classId} onChange={e=>setForm({...form, classId:e.target.value})}>
          <option value="">Select Class</option>
          <option value="FY">F.Y</option>
          <option value="SY">S.Y</option>
          <option value="TY">T.Y</option>
          <option value="BTECH">B.Tech</option>
        </select>
        <input className="border rounded-md px-3 py-2" placeholder="Roll No" value={form.rollNo} onChange={e=>setForm({...form, rollNo:e.target.value})} />
        <input className="border rounded-md px-3 py-2" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        <button className="px-4 py-2 rounded-md bg-gray-900 text-white">Add Student</button>
      </form>
      <div className="bg-white rounded-xl p-4 shadow border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2">Name</th><th>Email</th><th>Class</th><th>Roll No</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(s => (
              <tr key={s.id} className="border-t">
                <td className="py-2">
                  {editId === s.id ? (
                    <input className="border rounded-md px-2 py-1" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} />
                  ) : s.name || "-"}
                </td>
                <td>{s.email}</td>
                <td>{editId === s.id ? (
                  <select className="border rounded-md px-2 py-1" value={editForm.classId} onChange={e=>setEditForm({...editForm, classId:e.target.value})}>
                    <option value="">Select Class</option>
                    <option value="FY">F.Y</option>
                    <option value="SY">S.Y</option>
                    <option value="TY">T.Y</option>
                    <option value="BTECH">B.Tech</option>
                  </select>
                ) : s.classId || "-"}</td>
                <td>{editId === s.id ? (
                  <input className="border rounded-md px-2 py-1" value={editForm.rollNo} onChange={e=>setEditForm({...editForm, rollNo:e.target.value})} />
                ) : s.rollNo || "-"}</td>
                <td>
                  {editId === s.id ? (
                    <button className="px-2 py-1 bg-green-600 text-white rounded mr-2" onClick={saveEdit}>Save</button>
                  ) : (
                    <button className="px-2 py-1 bg-blue-600 text-white rounded mr-2" onClick={()=>startEdit(s)}>Edit</button>
                  )}
                  <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=>deleteStudent(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-3">Tip: Use this panel to add, edit, or delete students.</p>
      </div>
    </div>
  );
}
