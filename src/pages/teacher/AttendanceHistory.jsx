import React, { useEffect, useState } from "react";
import { db, DB } from "../../firebase/firebase.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AttendanceHistory() {
  const { profile } = useAuth();
  const classId = profile?.classId;
  const [list, setList] = useState([]);

  useEffect(() => {
    if (!classId) return;
    (async () => {
      const snap = await DB.getDocs(DB.collection(db, "attendance"));
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((x) => x.classId === classId)
        .sort((a,b)=> (a.date > b.date ? -1 : 1));
      setList(items);
    })();
  }, [classId]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Attendance History</h1>
      <div className="bg-white rounded-xl shadow border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 px-3">Date</th>
              <th className="px-3">Records</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2 px-3">{r.date}</td>
                <td className="px-3">{Object.keys(r.students || {}).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
