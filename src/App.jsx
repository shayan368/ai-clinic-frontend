import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import Login                   from "./pages/auth/Login.jsx";
import Register                from "./pages/auth/Register.jsx";
import DashboardLayout         from "./components/layout/DashboardLayout.jsx";
import Dashboard               from "./pages/dashboard/Dashboard.jsx";
import Patients                from "./pages/patients/Patients.jsx";
import PatientProfile          from "./pages/patients/PatientProfile.jsx";
import Appointments            from "./pages/appointments/Appointments.jsx";
import DoctorSchedule          from "./pages/appointments/DoctorSchedule.jsx";
import Prescriptions           from "./pages/prescriptions/Prescriptions.jsx";
import PatientPrescriptions    from "./pages/prescriptions/PatientPrescriptions.jsx";
import Diagnosis               from "./pages/diagnosis/Diagnosis.jsx";
import PrescriptionExplanation from "./pages/diagnosis/PrescriptionExplanation.jsx";
import Analytics               from "./pages/analytics/Analytics.jsx";
import Settings                from "./pages/settings/Settings.jsx";
import AdminDoctors            from "./pages/admin/AdminDoctors.jsx";
import AdminStaff              from "./pages/admin/AdminStaff.jsx";
import PatientDashboard        from "./pages/patient/PatientDashboard.jsx";
import DoctorDashboard         from "./pages/doctor/DoctorDashboard.jsx";
import ReceptionistDashboard   from "./pages/receptionist/ReceptionistDashboard.jsx";
// ─────────────────────────────────────────────
// ROUTE GUARDS
// ─────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight:      "100vh",
        background:     "#F8FAFC",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
      }}>
        <div style={{
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          gap:           "12px",
        }}>
          <div style={{
            width:          "36px",
            height:         "36px",
            borderRadius:   "50%",
            border:         "3px solid #E2E8F0",
            borderTopColor: "#14B8A6",
            animation:      "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
            Loading workspace...
          </p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== "admin")
    return <Navigate to="/app/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={getHomeRoute(user.role)} replace />;
  return children;
};

// ── Role-based home route ──
const getHomeRoute = (role) => {
  switch (role) {
    case "patient":      return "/app/patient-dashboard";
    case "doctor":       return "/app/doctor-dashboard";
    case "receptionist": return "/app/receptionist-dashboard";
    default:             return "/app/dashboard";
  }
};

// ── Default redirect after login ──
const DefaultRoute = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getHomeRoute(user.role)} replace />;
};

// ── Smart prescriptions route ──
const PrescriptionsRoute = () => {
  const { isPatient } = useAuth();
  return isPatient ? <PatientPrescriptions /> : <Prescriptions />;
};

// ─────────────────────────────────────────────
// APP ROUTES
// ─────────────────────────────────────────────
export default function App() {
  return (
    <Routes>

      {/* Root redirect */}
      <Route path="/" element={<DefaultRoute />} />

      {/* Public */}
      <Route path="/login"
        element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"
        element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Default index */}
        <Route index element={<DefaultRoute />} />

        {/* ── Role-specific dashboards ── */}
        <Route path="patient-dashboard"
          element={<PatientDashboard />} />

        <Route path="doctor-dashboard"
          element={<DoctorDashboard />} />
          <Route path="receptionist-dashboard" element={<ReceptionistDashboard />} />


        {/* ── Shared dashboard (admin/receptionist) ── */}
        <Route path="dashboard"
          element={<Dashboard />} />

        {/* ── Patients ── */}
        <Route path="patients"
          element={<Patients />} />
        <Route path="patients/:id"
          element={<PatientProfile />} />

        {/* ── Appointments ── */}
        <Route path="appointments"
          element={<Appointments />} />
        <Route path="schedule"
          element={<DoctorSchedule />} />

        {/* ── Prescriptions ── */}
        <Route path="prescriptions"
          element={<PrescriptionsRoute />} />

        {/* ── AI / Diagnosis ── */}
        <Route path="diagnosis"
          element={<Diagnosis />} />
        <Route path="diagnosis/explanation"
          element={<PrescriptionExplanation />} />

        {/* ── Analytics ── */}
        <Route path="analytics"
          element={<Analytics />} />

        {/* ── Settings ── */}
        <Route path="settings"
          element={<Settings />} />

        {/* ── Admin only ── */}
        <Route path="admin/doctors"
          element={
            <AdminRoute><AdminDoctors /></AdminRoute>
          }
        />
        <Route path="admin/staff"
          element={
            <AdminRoute><AdminStaff /></AdminRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={
        <div style={{
          minHeight:      "100vh",
          background:     "#F8FAFC",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexDirection:  "column",
          gap:            "12px",
        }}>
          <h1 style={{
            fontSize:             "64px",
            fontWeight:           700,
            background:           "linear-gradient(135deg,#0F766E,#6366F1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:  "transparent",
            margin:               0,
          }}>
            404
          </h1>
          <p style={{ color: "#94A3B8", margin: 0 }}>
            Page not found
          </p>
          <a href="/app/dashboard"
             style={{ color: "#0F766E", fontSize: "14px" }}>
            Back to dashboard
          </a>
        </div>
      } />

    </Routes>
  );
}