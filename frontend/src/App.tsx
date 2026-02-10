import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import StudentSignup from "./pages/StudentSignup";
import TeacherSignup from "./pages/TeacherSignup";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import History from "./pages/History";
import Students from "./pages/Students";
import Marks from "./pages/Marks";
import Settings from "@/pages/Settings";
import NotFound from "./pages/NotFound";
import StudentDashboard from "./pages/StudentDashboard";
import StudentAttendanceHistory from "./pages/StudentAttendanceHistory";
import SubjectsPage from "./pages/SubjectsPage";
import AdminDashboard from "./pages/AdminDashboard";
import { RequireAuth } from "@/components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student-signup" element={<StudentSignup />} />
          <Route path="/teacher-signup" element={<TeacherSignup />} />

          {/* Teacher Routes */}
          <Route element={
            <RequireAuth role="teacher">
              <DashboardLayout />
            </RequireAuth>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/marks" element={<Marks />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/history" element={<History />} />
            <Route path="/students" element={<Students />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student-dashboard" element={
            <RequireAuth role="student">
              <StudentDashboard />
            </RequireAuth>
          } />
          <Route path="/student/attendance-history" element={
            <RequireAuth role="student">
              <StudentAttendanceHistory />
            </RequireAuth>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <RequireAuth role="admin">
              <AdminDashboard />
            </RequireAuth>
          } />
          {/* Note: Other admin functions are handled within the dashboard for now to keep it centralized as requested */}
          <Route path="/admin/users" element={
            <RequireAuth role="admin">
              <Settings />
            </RequireAuth>
          } />
          <Route path="/admin/departments" element={
            <RequireAuth role="admin">
              <Settings />
            </RequireAuth>
          } />
          <Route path="/admin/reports" element={
            <RequireAuth role="admin">
              <History />
            </RequireAuth>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
