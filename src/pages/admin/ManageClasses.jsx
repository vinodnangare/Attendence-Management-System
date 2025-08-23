import React, { useEffect, useState } from "react";
import { db, DB } from "../../firebase/firebase.js";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

export default function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ id: "", name: "" });
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  async function load() {
    const snap = await DB.getDocs(DB.collection(db, "classes"));
    setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  useEffect(() => { load(); }, []);

  async function createClass(e) {
    e.preventDefault();
    if (!form.id || !form.name) return;
    await setDoc(doc(db, "classes", form.id), { name: form.name });
    setForm({ id: "", name: "" });
    await load();
  }

  function startEdit(c) {
    setEditId(c.id);
    setEditName(c.name);
  }

  async function saveEdit(e) {
    e.preventDefault();
    await updateDoc(doc(db, "classes", editId), { name: editName });
    setEditId(null);
    setEditName("");
    await load();
  }

  async function deleteClass(id) {
    if (!window.confirm("Delete this class?")) return;
    await deleteDoc(doc(db, "classes", id));
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Manage Classes</h1>

      <form onSubmit={createClass} className="bg-white rounded-xl p-4 shadow border mb-4 flex gap-2">
        <input className="border rounded-md px-3 py-2" placeholder="Class ID (e.g., IT-3A)"
               value={form.id} onChange={(e)=>setForm({...form, id:e.target.value})}/>
        <input className="border rounded-md px-3 py-2" placeholder="Class Name"
               value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})}/>
        <button className="px-4 py-2 rounded-md bg-gray-900 text-white">Add</button>
      </form>

      <div className="bg-white rounded-xl p-4 shadow border">
        <ul className="space-y-2">
          {classes.map((c) => (
            <li key={c.id} className="flex justify-between items-center border p-3 rounded-md">
              <span>
                {editId === c.id ? (
                  <form onSubmit={saveEdit} className="inline">
                    <input className="border rounded-md px-2 py-1 mr-2" value={editName} onChange={e=>setEditName(e.target.value)} />
                    <button className="px-2 py-1 bg-green-600 text-white rounded mr-2">Save</button>
                  </form>
                ) : (
                  <>
                    <span className="font-semibold">{c.id}</span> – {c.name}
                  </>
                )}
              </span>
              <span>
                {editId === c.id ? null : (
                  <>
                    <button className="px-2 py-1 bg-blue-600 text-white rounded mr-2" onClick={()=>startEdit(c)}>Edit</button>
                    <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=>deleteClass(c.id)}>Delete</button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
