import React, { useEffect, useState } from "react";
// Removed duplicate import
import { db, DB } from "../../firebase/firebase.js";
import { updateDoc, doc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext.jsx";
import { toast } from "react-toastify";
import { UserCheck, Loader2 } from "lucide-react";

function todayKey() {
  const d = new Date();
  const iso = d.toISOString().slice(0,10); // YYYY-MM-DD
  return iso;
}

export default function MarkAttendance() {
  const { profile } = useAuth();
  const classId = profile?.classId;
  // Fix: subject should be from profile, fallback to empty string
  const subject = (profile && typeof profile.subject === "string" && profile.subject.trim() !== "") ? profile.subject : "";
  const [students, setStudents] = useState([]);
  const [status, setStatus] = useState({}); // {studentId: "present"|"absent"}
  const [saving, setSaving] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [records, setRecords] = useState([]); // previous attendance records
  const [editId, setEditId] = useState(null);
  const [editStudents, setEditStudents] = useState({});
  const dateKey = todayKey();
  const presentCount = students.filter(s => status[s.id] === "present").length;
  const absentCount = students.length - presentCount;

  useEffect(() => {
    if (!classId) return;
    (async () => {
      // Load students
      const snap = await DB.getDocs(DB.query(DB.collection(db, "users"),
        DB.where("role", "==", "student"), DB.where("classId", "==", classId)));
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list = list.sort((a, b) => {
        const ra = parseInt(a.rollNo, 10);
        const rb = parseInt(b.rollNo, 10);
        if (!isNaN(ra) && !isNaN(rb)) return ra - rb;
        if (!isNaN(ra)) return -1;
        if (!isNaN(rb)) return 1;
        return 0;
      });
      setStudents(list);
      // load existing for today, subject, and time, if any
      if (!subject || !selectedTime) return;
      const docId = `${classId}_${profile?.id || "teacher"}_${subject}_${selectedTime}_${dateKey}`;
      const attRef = DB.doc(db, "attendance", docId);
      const attSnap = await DB.getDoc(attRef);
      if (attSnap.exists()) setStatus(attSnap.data().students || {});
    })();
  }, [classId, dateKey, subject, selectedTime, profile?.id]);

  // Load previous attendance records for edit
  useEffect(() => {
    if (!classId || !subject || !selectedTime) return setRecords([]);
    (async () => {
      const snap = await DB.getDocs(DB.query(DB.collection(db, "attendance")));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((x) => x.classId === classId && x.subject === subject && x.time === selectedTime)
        .sort((a, b) => (a.date > b.date ? -1 : 1));
      setRecords(list);
    })();
  }, [classId, subject, selectedTime, saving]);

  function startEdit(r) {
    setEditId(r.id);
    setEditStudents({ ...r.students });
  }

  async function saveEdit(e) {
    e.preventDefault();
    console.log('saveEdit called', editId, editStudents);
    await updateDoc(doc(db, "attendance", editId), {
      students: editStudents,
    });
  setEditId(null);
  setEditStudents({});
  toast.success("Attendance updated.");
  setSaving(s => !s); // trigger useEffect to reload records
  }

  function toggle(id) {
    setStatus((s) => ({ ...s, [id]: s[id] === "present" ? "absent" : "present" }));
  }

  async function save() {
    if (!subject || !selectedTime) {
      let msg = "";
      if (!subject) msg += "Subject is missing. ";
      if (!selectedTime) msg += "Time is missing.";
      toast.error(msg.trim() || "Please select subject and time.");
      return;
    }
    setSaving(true);
    try {
      const docId = `${classId}_${profile?.id || "teacher"}_${subject}_${selectedTime}_${dateKey}`;
      await DB.setDoc(DB.doc(db, "attendance", docId), {
        classId,
        teacherId: profile?.id || "teacher",
        subject,
        time: selectedTime,
        date: dateKey,
        students: status,
        updatedAt: Date.now(),
      }, { merge: true });
      toast.success("Attendance saved for " + dateKey);
    } catch (err) {
      toast.error("Error saving attendance: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
        <UserCheck className="text-blue-600" size={28} />
        Mark Attendance <span className="text-base font-normal text-gray-500">(Today: {dateKey})</span>
      </h1>
      {profile?.name && (
        <div className="text-lg font-bold mb-4 text-blue-700">Teacher: {profile.name}</div>
      )}
      {!classId ? (
        <p className="text-sm text-red-600">No class assigned.</p>
      ) : (
        <>
          <div className="mb-4 flex gap-4 flex-wrap items-center">
            <div>
              <label className="font-medium mr-2">Subject:</label>
              <input className="border rounded-md px-3 py-2" value={subject} disabled />
            </div>
            <div>
              <label className="font-medium mr-2">Time:</label>
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
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-green-600 font-semibold">Present: {presentCount}</span>
              <span className="text-red-600 font-semibold">Absent: {absentCount}</span>
            </div>
          </div>
          {selectedTime ? (
            <>
            <div className="bg-white rounded-xl shadow border overflow-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 px-3">Roll No</th>
                    <th className="py-2 px-3">Student</th>
                    <th className="px-3">Email</th>
                    <th className="px-3">Present
                      <input
                        type="checkbox"
                        className="ml-2"
                        checked={students.length > 0 && students.every(s => status[s.id] === "present")}
                        onChange={e => {
                          const checked = e.target.checked;
                          setStatus(s => {
                            const newStatus = { ...s };
                            students.forEach(stu => {
                              newStatus[stu.id] = checked ? "present" : "absent";
                            });
                            return newStatus;
                          });
                        }}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-t">
                      <td className="py-2 px-3">{typeof s.rollNo !== 'undefined' && s.rollNo !== null && s.rollNo !== '' ? s.rollNo : <span className="text-gray-400 italic">No Roll</span>}</td>
                      <td className="py-2 px-3">{s.name || s.email}</td>
                      <td className="px-3">{s.email}</td>
                      <td className="px-3 text-center">
                        <input
                          type="checkbox"
                          checked={status[s.id] === "present"}
                          onChange={e => setStatus(st => ({ ...st, [s.id]: e.target.checked ? "present" : "absent" }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Editable previous records */}
            <div className="bg-white rounded-xl shadow border overflow-auto">
              <h2 className="text-lg font-bold mb-2 px-4 pt-4">Edit Previous Attendance</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 px-3">Date</th>
                    <th className="px-3">Students</th>
                    <th className="px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 px-3">{r.date}</td>
                      <td className="px-3">
                        {editId === r.id ? (
                          <form onSubmit={saveEdit} className="flex flex-wrap gap-2">
                            {students.map(s => (
                              <div key={s.id} className="flex items-center gap-1">
                                <span className="font-mono text-xs">{s.name}</span>
                                <select
                                  className="border rounded px-1 py-0.5"
                                  value={editStudents[s.id] || "absent"}
                                  onChange={e => setEditStudents(st => ({ ...st, [s.id]: e.target.value }))}
                                >
                                  <option value="present">Present</option>
                                  <option value="absent">Absent</option>
                                </select>
                              </div>
                            ))}
                            <button
                              type="submit"
                              className="px-2 py-1 bg-green-600 text-white rounded ml-2"
                              style={{ pointerEvents: 'auto', zIndex: 10 }}
                              disabled={false}
                            >
                              Save
                            </button>
                          </form>
                        ) : (
                          <ul className="flex flex-wrap gap-2">
                            {Object.entries(r.students || {}).map(([sid, status]) => (
                              <li key={sid} className={status === "present" ? "text-green-700" : "text-red-700"}>
                                {students.find(s => s.id === sid)?.name || sid}: {status}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-3">
                        {editId === r.id ? null : (
                          <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => startEdit(r)}>
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">Select a time slot to mark attendance.</p>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white font-semibold flex items-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : null}
            {saving ? "Saving..." : "Save Attendance"}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Demo setting: editable all day. In production, lock after 24h and allow admin-only edits.
          </p>
        </>
      )}
    </div>
  );
}
