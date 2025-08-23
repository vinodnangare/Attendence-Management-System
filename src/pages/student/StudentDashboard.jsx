import React, { useEffect, useState } from "react";
import { db, DB } from "../../firebase/firebase.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [subjectStats, setSubjectStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [history, setHistory] = useState([]);
  const [filterMonth, setFilterMonth] = useState("");

  const [summary, setSummary] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    overallPct: 0,
    risk: false,
  });

  // Auto-reload hack
  useEffect(() => {
    const reloaded = sessionStorage.getItem("reloadedOnce");
    if (!reloaded) {
      sessionStorage.setItem("reloadedOnce", "true");
      setTimeout(() => {
        window.location.reload();
      }, 1000); // reload after 1 second
    }
  }, []);

  // Fetch attendance data
  useEffect(() => {
    if (!profile?.classId || !user?.uid) return;

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const snap = await DB.getDocs(DB.collection(db, "attendance"));
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((x) => x.classId === profile.classId);

        const subjects = {};
        list.forEach((rec) => {
          const subj = rec.subject || "Unknown";
          if (!subjects[subj]) subjects[subj] = [];
          subjects[subj].push(rec);
        });

        const stats = Object.entries(subjects).map(([subject, records]) => {
          const totalDays = records.length;
          let presentCount = 0;

          // Process records
          const processedRecords = records.map((r) => {
            const dateStr = r.date?.seconds
              ? new Date(r.date.seconds * 1000).toISOString().slice(0, 10)
              : r.date;

            const status =
              r.students && r.students[user.uid] === "present" ? "present" : "absent";
            if (status === "present") presentCount++;

            return { ...r, date: dateStr, status };
          });

          const pct = totalDays ? Math.round((presentCount / totalDays) * 100) : 0;

          const todayIso = new Date().toISOString().slice(0, 10);
          const todayRec = processedRecords.find((r) => r.date === todayIso);
          const today = todayRec ? todayRec.status : "-";

          return { subject, totalDays, presentCount, pct, today, records: processedRecords };
        });

        setSubjectStats(stats);

        // Summary
        let totalPresent = 0;
        let totalAbsent = 0;
        stats.forEach((sub) => {
          sub.records.forEach((lec) => {
            if (lec.status === "present") totalPresent++;
            else totalAbsent++;
          });
        });

        const overallPct =
          totalPresent + totalAbsent > 0
            ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
            : 0;

        setSummary({ totalPresent, totalAbsent, overallPct, risk: overallPct < 75 });
      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [profile, user]);
  // Handle subject card click
  const handleCardClick = (subject) => {
    setSelectedSubject(subject.subject);
    setFilterMonth("");

    const hist = subject.records
      .sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        return bDate - aDate;
      })
      .map((r) => ({ date: r.date, status: r.status }));

    setHistory(hist);
  };

  const filteredHistory = filterMonth
    ? history.filter((h) => h.date.startsWith(filterMonth))
    : history;

  if (!user || !profile) return <p className="text-center mt-10">Loading profile...</p>;
  if (loading) return <p className="text-center mt-10">Loading attendance...</p>;
  if (subjectStats.length === 0)
    return <p className="text-center mt-10">No attendance data found.</p>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 mt-4">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-md p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt="Profile"
              className="w-14 h-14 rounded-full object-cover border"
            />
          ) : null}
          <div>
            <h2 className="text-2xl font-bold">Welcome, {profile.name}</h2>
            <p className="text-gray-600">
              Roll No: {profile.rollNo} | Class: {profile.classId}
            </p>
            {profile.section && <p className="text-gray-600">Section: {profile.section}</p>}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-md p-5 mb-6 flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <div className="text-gray-500 text-sm">Total Present Lectures</div>
          <div className="text-2xl font-bold text-green-600">{summary.totalPresent}</div>
        </div>
        <div className="text-center sm:text-left">
          <div className="text-gray-500 text-sm">Total Absent Lectures</div>
          <div className="text-2xl font-bold text-red-600">{summary.totalAbsent}</div>
        </div>
        <div className="text-center sm:text-left">
          <div className="text-gray-500 text-sm">Overall Attendance %</div>
          <div className="text-2xl font-bold text-blue-500">{summary.overallPct}%</div>
        </div>
        {summary.risk && (
          <div className="text-center sm:text-left self-center">
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-semibold">
              Attendance Below 75%!
            </span>
          </div>
        )}
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {subjectStats.map((stat) => (
          <div
            key={stat.subject}
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition cursor-pointer border border-gray-200"
            onClick={() => handleCardClick(stat)}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="text-xl font-bold text-gray-700">{stat.subject}</div>
              {stat.pct < 75 && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">
                  Low
                </span>
              )}
            </div>
            <div className="flex justify-between mt-2">
              <div>
                <div className="text-sm text-gray-500">Today's Status</div>
                <div
                  className={`text-2xl font-bold ${
                    stat.today === "present" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.today}
                </div>
              </div>
              <div className="flex flex-col items-end ">
                <div className="text-sm text-gray-500">Attendance %</div>
                <div className="w-24 h-3 bg-gray-200 rounded-full mt-1">
                  <div
                    className={`h-3 rounded-full ${
                      stat.pct >= 75 ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{ width: `${stat.pct}%` }}
                  ></div>
                </div>
                <div className="text-sm mt-1 font-semibold text-gray-700">{stat.pct}%</div>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              {stat.presentCount}/{stat.totalDays} lectures present
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 flex items-start justify-center z-50 pt-20 px-4">
          <div
            className="absolute inset-0 bg-black opacity-30"
            onClick={() => setSelectedSubject(null)}
          ></div>
          <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-5 border border-gray-200 z-50">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 font-bold text-lg"
              onClick={() => setSelectedSubject(null)}
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-4">{selectedSubject} Attendance History</h3>

            {/* Month Filter */}
            <div className="mb-4 flex gap-2 items-center">
              <label className="text-gray-600 text-sm">Filter Month:</label>
              <input
                type="month"
                className="border p-1 rounded-md text-sm"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
              {filterMonth && (
                <button
                  className="text-blue-500 text-sm font-semibold"
                  onClick={() => setFilterMonth("")}
                >
                  Reset
                </button>
              )}
            </div>

            {/* History List */}
                       <div className="space-y-2">
              {filteredHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No records for this month.</p>
              ) : (
                filteredHistory.map((h) => (
                  <div
                    key={h.date}
                    className="flex justify-between bg-gray-50 p-2 rounded-lg border border-gray-200"
                  >
                    <span>{h.date}</span>
                    <span
                      className={`font-semibold ${
                        h.status === "present" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
