import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import NotFound from "./pages/NotFound.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import TeacherLayout from "./layouts/TeacherLayout.jsx";
import StudentLayout from "./layouts/StudentLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ManageTeachers from "./pages/admin/ManageTeachers.jsx";
import ManageStudents from "./pages/admin/ManageStudents.jsx";
import ManageClasses from "./pages/admin/ManageClasses.jsx";
import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import MarkAttendance from "./pages/teacher/MarkAttendance.jsx";
import AttendanceHistory from "./pages/teacher/AttendanceHistory.jsx";
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import AttendanceReport from "./pages/student/AttendanceReport.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ManageAttendance from "./pages/admin/ManageAttendance.jsx";

export default function Router() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/attendance" element={<ManageAttendance />} />
          <Route path="/admin/teachers" element={<ManageTeachers />} />
          <Route path="/admin/students" element={<ManageStudents />} />
          <Route path="/admin/classes" element={<ManageClasses />} />
        </Route>
      </Route>

      {/* Teacher */}
      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route element={<TeacherLayout />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/mark" element={<MarkAttendance />} />
          <Route path="/teacher/history" element={<AttendanceHistory />} />
        </Route>
      </Route>

      {/* Student */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route element={<StudentLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/report" element={<AttendanceReport />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
