import React, { useEffect, useState } from "react";
import { db, DB } from "../../firebase/firebase.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AttendanceReport() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.uid || !profile || !profile.classId) return;

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const snap = await DB.getDocs(DB.collection(db, "attendance"));
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((x) => x.classId === profile.classId)
          .sort((a, b) => {
            let aDate = a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date);
            let bDate = b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date);
            return bDate - aDate; // newest first
          })
          .map((x) => {
            let recDate = x.date?.seconds
              ? new Date(x.date.seconds * 1000).toISOString().slice(0, 10)
              : x.date;
            return { date: recDate, status: x.students?.[user.uid] || "absent" };
          });

        setRows(list);
      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [user, profile]);

  if (!user || !profile) return <p className="text-center mt-10">Loading profile...</p>;
  if (loading) return <p className="text-center mt-10">Loading attendance report...</p>;
  if (rows.length === 0) return <p className="text-center mt-10">No attendance records found.</p>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">My Attendance Report</h1>

      {/* Responsive Table / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <div
            key={r.date}
            className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl border border-gray-200 transition"
          >
            <div className="flex justify-between items-center">
              <div className="text-gray-500 text-sm">Date</div>
              <div className="text-gray-700 font-semibold">{r.date}</div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-gray-500 text-sm">Status</div>
              <div
                className={`font-bold text-lg ${
                  r.status === "present" ? "text-green-600" : "text-red-600"
                }`}
              >
                {r.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
