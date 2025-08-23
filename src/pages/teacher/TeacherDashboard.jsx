import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function TeacherDashboard() {
  const { profile } = useAuth();
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Teacher Dashboard</h1>
      <p className="text-gray-600">Assigned Class: <b>{profile?.classId || "-"}</b></p>
      <div className="mt-4 p-4 bg-white rounded-xl shadow border">
        <p>Quick links: use the sidebar to mark today's attendance or view history.</p>
      </div>
    </div>
  );
}
