import React, { useEffect, useState } from "react";
import { db, DB } from "../../firebase/firebase.js";
import { doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceStudents, setAttendanceStudents] = useState({});
  const [editId, setEditId] = useState(null);
  const [editStudents, setEditStudents] = useState({});

  useEffect(() => {
    async function loadClassesAndTeachers() {
      const classSnap = await DB.getDocs(DB.collection(db, "classes"));
      setClasses(classSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      const teacherSnap = await DB.getDocs(DB.query(DB.collection(db, "users"), DB.where("role", "==", "teacher")));
      setTeachers(teacherSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    loadClassesAndTeachers();
  }, []);

  // Load students for selected class
  useEffect(() => {
    async function loadStudents() {
      if (!selectedClass) return setStudents([]);
      const snap = await DB.getDocs(DB.query(DB.collection(db, "users"), DB.where("role", "==", "student"), DB.where("classId", "==", selectedClass)));
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    loadStudents();
  }, [selectedClass]);

  useEffect(() => {
    async function loadRecords() {
      if (!selectedClass || !selectedTeacher || !selectedSubject || !selectedTime) return setRecords([]);
      const snap = await DB.getDocs(DB.query(DB.collection(db, "attendance")));
      setRecords(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((x) => x.classId === selectedClass && x.teacherId === selectedTeacher && x.subject === selectedSubject && x.time === selectedTime)
          .sort((a, b) => (a.date > b.date ? -1 : 1))
      );
    }
    loadRecords();
  }, [selectedClass, selectedTeacher, selectedSubject, selectedTime]);
  // Add attendance record with student checkboxes
  async function addAttendance(e) {
    e.preventDefault();
    if (!selectedClass || !selectedTeacher || !selectedSubject || !selectedTime) return alert("Please select all fields.");
    if (students.length === 0) return alert("No students found for this class.");
    const newRecord = {
      classId: selectedClass,
      teacherId: selectedTeacher,
      subject: selectedSubject,
      time: selectedTime,
      date: new Date().toISOString().slice(0, 10),
      students: attendanceStudents,
    };
    const docId = `${selectedClass}_${selectedTeacher}_${selectedSubject}_${selectedTime}_${newRecord.date}`;
    await setDoc(doc(db, "attendance", docId), newRecord);
    setSelectedSubject("");
    setSelectedTime("");
    setAttendanceStudents({});
    // reload
    const snap = await DB.getDocs(DB.query(DB.collection(db, "attendance")));
    setRecords(
      snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((x) => x.classId === selectedClass && x.teacherId === selectedTeacher && x.subject === selectedSubject && x.time === selectedTime)
        .sort((a, b) => (a.date > b.date ? -1 : 1))
    );
  }

  function startEdit(r) {
    setEditId(r.id);
    setEditStudents({ ...r.students });
  }

  async function saveEdit(e) {
    e.preventDefault();
    await updateDoc(doc(db, "attendance", editId), {
      students: editStudents,
    });
    setEditId(null);
    setEditStudents({});
    // reload
    const snap = await DB.getDocs(DB.query(DB.collection(db, "attendance")));
    setRecords(
      snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((x) => x.classId === selectedClass)
        .sort((a, b) => (a.date > b.date ? -1 : 1))
    );
  }

  async function deleteRecord(id) {
    if (!window.confirm("Delete this attendance record?")) return;
    await deleteDoc(doc(db, "attendance", id));
    setRecords(records.filter((r) => r.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Manage Attendance</h1>
      <form onSubmit={addAttendance} className="mb-4 flex flex-wrap gap-2 items-center">
        <label className="font-medium">Class:</label>
        <select className="border rounded-md px-3 py-2" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          <option value="">-- Select --</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.id} - {c.name}</option>)}
        </select>
        <label className="font-medium">Teacher:</label>
        <select className="border rounded-md px-3 py-2" value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
          <option value="">-- Select --</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <label className="font-medium">Subject:</label>
        <input className="border rounded-md px-3 py-2" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} placeholder="Subject name" />
        <label className="font-medium">Time:</label>
        <select className="border rounded-md px-3 py-2" value={selectedTime} onChange={e => setSelectedTime(e.target.value)}>
          <option value="">-- Select --</option>
          <option value="10am-11am">10am-11am</option>
          <option value="11am-12pm">11am-12pm</option>
          <option value="12pm-1pm">12pm-1pm</option>
          <option value="1pm-2pm">1pm-2pm</option>
          <option value="2pm-3pm">2pm-3pm</option>
          <option value="3pm-4pm">3pm-4pm</option>
          <option value="4pm-5pm">4pm-5pm</option>
        </select>
        {/* Student checkboxes for attendance */}
        {students.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-medium">Mark Attendance:</span>
            {students.map(s => (
              <label key={s.id} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={attendanceStudents[s.id] === "present"}
                  onChange={e => setAttendanceStudents(a => ({ ...a, [s.id]: e.target.checked ? "present" : "absent" }))}
                />
                <span className="text-xs font-mono">{s.name}</span>
              </label>
            ))}
          </div>
        )}
        <button className="px-4 py-2 rounded-md bg-blue-600 text-white">Add Attendance</button>
      </form>
      <div className="bg-white rounded-xl p-4 shadow border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2">Date</th>
              <th>Subject</th>
              <th>Time</th>
              <th>Students</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.date}</td>
                <td>{r.subject}</td>
                <td>{r.time}</td>
                <td>
                  {editId === r.id ? (
                    <form onSubmit={saveEdit} className="flex flex-wrap gap-2">
                      {Object.entries(editStudents).map(([sid, status]) => (
                        <div key={sid} className="flex items-center gap-1">
                          <span className="font-mono text-xs">{sid}</span>
                          <select
                            className="border rounded px-1 py-0.5"
                            value={status}
                            onChange={e => setEditStudents(s => ({ ...s, [sid]: e.target.value }))}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                          </select>
                        </div>
                      ))}
                      <button className="px-2 py-1 bg-green-600 text-white rounded ml-2">Save</button>
                    </form>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {Object.entries(r.students || {}).map(([sid, status]) => (
                        <li key={sid} className={status === "present" ? "text-green-700" : "text-red-700"}>
                          {sid}: {status}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>
                  {editId === r.id ? null : (
                    <>
                      <button className="px-2 py-1 bg-blue-600 text-white rounded mr-2" onClick={() => startEdit(r)}>
                        Edit
                      </button>
                      <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteRecord(r.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-3">Tip: Edit or delete attendance records for any class, teacher, subject, and time.</p>
      </div>
    </div>
  );
}
