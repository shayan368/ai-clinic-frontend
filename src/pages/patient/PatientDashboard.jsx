import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { authAPI, appointmentAPI, prescriptionAPI,
         aiAPI, doctorAPI } from "../../api/axios.js";
import {
  Calendar, FileText, Download, Sparkles,
  Clock, CheckCircle2, User, Phone, Mail,
  Pill, X, Loader, Shield, Eye,
  AlertCircle, Activity, Brain, ChevronRight,
  RefreshCw, Plus, Pencil, Lock, EyeOff,
  Globe, Save, AlertTriangle,
} from "lucide-react";

import BookAppointmentModal from "./BookAppointmentModal.jsx";

// ─── shared tokens ───
const c = {
  card: {
    background:   "#FFFFFF",
    borderRadius: "16px",
    border:       "1px solid #E2E8F0",
    padding:      "24px",
    boxShadow:    "0 1px 3px rgba(0,0,0,0.06)",
  },
  btn: {
    display:        "inline-flex",
    alignItems:     "center",
    gap:            "8px",
    padding:        "10px 20px",
    borderRadius:   "10px",
    fontSize:       "14px",
    fontWeight:     600,
    cursor:         "pointer",
    border:         "none",
    background:     "linear-gradient(135deg,#0F766E,#6366F1)",
    color:          "#FFFFFF",
  },
  btnSec: {
    display:        "inline-flex",
    alignItems:     "center",
    gap:            "8px",
    padding:        "9px 16px",
    borderRadius:   "10px",
    fontSize:       "13px",
    fontWeight:     500,
    cursor:         "pointer",
    border:         "1px solid #E2E8F0",
    background:     "#FFFFFF",
    color:          "#475569",
  },
  input: {
    width:        "100%",
    padding:      "10px 14px",
    border:       "1px solid #E2E8F0",
    borderRadius: "10px",
    fontSize:     "14px",
    color:        "#0F172A",
    background:   "#F8FAFC",
    outline:      "none",
    boxSizing:    "border-box",
  },
  label: {
    fontSize:     "12px",
    fontWeight:   600,
    color:        "#94A3B8",
    display:      "block",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
};

// ── Status badge ──
const StatusBadge = ({ status }) => {
  const map = {
    confirmed: { bg: "#DCFCE7", color: "#15803D" },
    pending:   { bg: "#FEF3C7", color: "#B45309" },
    completed: { bg: "#F1F5F9", color: "#475569" },
    active:    { bg: "#DCFCE7", color: "#15803D" },
    cancelled: { bg: "#FEE2E2", color: "#DC2626" },
  };
  const cfg = map[status] || map.pending;
  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      padding:      "3px 10px",
      borderRadius: "20px",
      fontSize:     "12px",
      fontWeight:   500,
      background:   cfg.bg,
      color:        cfg.color,
    }}>
      {status}
    </span>
  );
};

// ── Stat card ──
const StatCard = ({ icon: Icon, label, value, color, bg, onClick }) => (
  <div
    onClick={onClick}
    style={{
      ...c.card,
      padding:  "20px",
      cursor:   onClick ? "pointer" : "default",
      transition: "all 0.2s",
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.boxShadow =
          "0 4px 12px rgba(0,0,0,0.10)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow =
        "0 1px 3px rgba(0,0,0,0.06)";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div style={{
      width:          "40px", height: "40px",
      borderRadius:   "12px", background: bg,
      display:        "flex", alignItems: "center",
      justifyContent: "center", marginBottom: "14px",
    }}>
      <Icon size={18} style={{ color }} />
    </div>
    <p style={{ fontSize: "26px", fontWeight: 700,
                color: "#0F172A", margin: 0 }}>
      {value}
    </p>
    <p style={{ fontSize: "13px", color: "#94A3B8",
                margin: "4px 0 0" }}>
      {label}
    </p>
  </div>
);

// ── Tab button ──
const TabBtn = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display:      "flex",
      alignItems:   "center",
      gap:          "8px",
      padding:      "9px 18px",
      borderRadius: "9px",
      border:       "none",
      fontSize:     "14px",
      fontWeight:   active ? 600 : 400,
      cursor:       "pointer",
      transition:   "all 0.2s",
      background:   active ? "#FFFFFF" : "transparent",
      color:        active ? "#0F172A" : "#64748B",
      boxShadow:    active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
      whiteSpace:   "nowrap",
    }}
  >
    <Icon size={15} />
    {label}
  </button>
);

export default function PatientDashboard() {
  const { user, updateUser, isPro } = useAuth();
  const navigate                    = useNavigate();

const [tab, setTab] = useState(() => {
  // Restore tab from global if coming back
  return window.__patientTab || "dashboard";
});
  const [appointments, setAppointments] = useState([]);
  const [prescriptions,setPrescriptions]= useState([]);
  const [diagnosisLogs,setDiagnosisLogs]= useState([]);
  const [doctors,      setDoctors]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [downloading,  setDownloading]  = useState(null);
  const [aiModal,      setAiModal]      = useState(null);
  const [viewPres,     setViewPres]     = useState(null);
  const [bookModal,    setBookModal]    = useState(false);
  const [reschedModal, setReschedModal] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [apptRes, presRes, docRes, logsRes] =
        await Promise.all([
          appointmentAPI.getByPatient(user.id),
          prescriptionAPI.getByPatient(user.id),
          doctorAPI.getAll(),
          aiAPI.getLogsByPatient(user.id),
        ]);
      setAppointments(apptRes.data.data   || []);
      setPrescriptions(presRes.data.data  || []);
      setDoctors(docRes.data.data         || []);
      setDiagnosisLogs(logsRes.data.data  || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Listen to sidebar tab changes ──
useEffect(() => {
  const handler = (e) => {
    setTab(e.detail);
    window.__patientTab = e.detail;
  };
  window.addEventListener("patient-tab-change", handler);
  return () =>
    window.removeEventListener("patient-tab-change", handler);
}, []);

  const getDoctorName = (id) => {
    const d = doctors.find((d) => d.id === id);
    return d
      ? `Dr. ${d.firstName} ${d.lastName}`
      : `Doctor #${id}`;
  };

  const handleDownload = async (id) => {
    setDownloading(id);
    try {
      const res  = await prescriptionAPI.download(id);
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `prescription_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  const handleCancelAppt = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await appointmentAPI.update(id, { status: "completed" });
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "completed" } : a
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const upcoming  = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  );
  const completed = appointments.filter(
    (a) => a.status === "completed"
  );
  const activeRx  = prescriptions.filter(
    (p) => p.status === "active"
  );

  const TABS = [
    { key: "dashboard",    label: "Dashboard",    icon: Activity   },
    { key: "appointments", label: "Appointments", icon: Calendar   },
    { key: "prescriptions",label: "Prescriptions",icon: FileText   },
    { key: "ai",           label: "AI & Health",  icon: Brain      },
    { key: "profile",      label: "Profile",      icon: User       },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column",
                    gap: "20px" }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ ...c.card, height: "100px",
                                background: "#F1F5F9",
                                animation: "pulse 1.5s infinite" }}
          />
        ))}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Welcome header ── */}
      <div style={{
        ...c.card,
        background: "linear-gradient(135deg,#F0FDFA,#EEF2FF)",
        border:     "1px solid #CCFBF1",
        display:    "flex",
        alignItems: "center",
        gap:        "20px",
        flexWrap:   "wrap",
      }}>
        <div style={{
          width:          "56px", height: "56px",
          borderRadius:   "16px", flexShrink: 0,
          background:     "linear-gradient(135deg,#0F766E30,#6366F130)",
          display:        "flex", alignItems: "center",
          justifyContent: "center",
          fontSize:       "20px", fontWeight: 700,
          color:          "#0F766E",
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "20px", fontWeight: 700,
                      color: "#0F172A", margin: 0 }}>
            Hello, {user?.firstName}!
          </p>
          <p style={{ fontSize: "13px", color: "#64748B",
                      margin: "4px 0 0" }}>
            {user?.email} · Patient Portal
          </p>
        </div>
        <button
          onClick={fetchAll}
          style={{ ...c.btnSec }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display:      "flex",
        gap:          "4px",
        padding:      "4px",
        borderRadius: "12px",
        background:   "#F1F5F9",
        border:       "1px solid #E2E8F0",
        overflowX:    "auto",
      }}>
        {TABS.map((t) => (
  <TabBtn key={t.key} active={tab === t.key}
    onClick={() => {
      setTab(t.key);
      window.__patientTab = t.key;
    }}
    icon={t.icon} label={t.label} />
))}
      </div>

      {/* ─────────────────── DASHBOARD TAB ─────────────────── */}
      {tab === "dashboard" && (
        <DashboardTab
          upcoming={upcoming}
          completed={completed}
          prescriptions={prescriptions}
          activeRx={activeRx}
          diagnosisLogs={diagnosisLogs}
          getDoctorName={getDoctorName}
          onGoAppts={() => setTab("appointments")}
          onGoPres={() => setTab("prescriptions")}
          onGoAI={() => setTab("ai")}
          onBook={() => setBookModal(true)}
        />
      )}

      {/* ─────────────────── APPOINTMENTS TAB ─────────────────── */}
      {tab === "appointments" && (
        <AppointmentsTab
          appointments={appointments}
          getDoctorName={getDoctorName}
          onBook={() => setBookModal(true)}
          onCancel={handleCancelAppt}
          onReschedule={(appt) => setReschedModal(appt)}
          onRefresh={fetchAll}
        />
      )}

      {/* ─────────────────── PRESCRIPTIONS TAB ─────────────────── */}
      {tab === "prescriptions" && (
        <PrescriptionsTab
          prescriptions={prescriptions}
          getDoctorName={getDoctorName}
          onDownload={handleDownload}
          downloading={downloading}
          onAI={(pres) => setAiModal(pres)}
          onView={(pres) => setViewPres(pres)}
        />
      )}

      {/* ─────────────────── AI & HEALTH TAB ─────────────────── */}
      {tab === "ai" && (
        <AITab
          prescriptions={prescriptions}
          diagnosisLogs={diagnosisLogs}
          getDoctorName={getDoctorName}
          isPro={isPro}
          onAI={(pres) => setAiModal(pres)}
        />
      )}

      {/* ─────────────────── PROFILE TAB ─────────────────── */}
      {tab === "profile" && (
        <ProfileTab user={user} updateUser={updateUser} />
      )}

      {/* ── Modals ── */}
      {bookModal && (
        <BookAppointmentModal
          doctors={doctors}
          userId={user.id}
          onClose={() => setBookModal(false)}
          onSaved={(appt) => {
            setAppointments((prev) => [appt, ...prev]);
            setBookModal(false);
          }}
        />
      )}

      {reschedModal && (
        <RescheduleModal
          appointment={reschedModal}
          onClose={() => setReschedModal(null)}
          onSaved={(updated) => {
            setAppointments((prev) =>
              prev.map((a) =>
                a.id === updated.id ? updated : a
              )
            );
            setReschedModal(null);
          }}
        />
      )}

      {viewPres && (
        <ViewPrescriptionModal
          prescription={viewPres}
          getDoctorName={getDoctorName}
          onClose={() => setViewPres(null)}
          onDownload={handleDownload}
          downloading={downloading}
          onAI={(pres) => {
            setViewPres(null);
            setAiModal(pres);
          }}
        />
      )}

      {aiModal && (
        <AIExplanationModal
          prescription={aiModal}
          onClose={() => setAiModal(null)}
        />
      )}

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-6px); }
        }
        @keyframes pulse  {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD TAB
// ─────────────────────────────────────────────
function DashboardTab({
  upcoming, completed, prescriptions, activeRx,
  diagnosisLogs, getDoctorName,
  onGoAppts, onGoPres, onGoAI, onBook,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Stat cards */}
      <div style={{ display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(140px,1fr))",
                    gap: "14px" }}>
        <StatCard icon={Calendar} label="Upcoming"
          value={upcoming.length} color="#0F766E" bg="#F0FDFA"
          onClick={onGoAppts} />
        <StatCard icon={CheckCircle2} label="Completed Visits"
          value={completed.length} color="#15803D" bg="#DCFCE7"
          onClick={onGoAppts} />
        <StatCard icon={FileText} label="Prescriptions"
          value={prescriptions.length} color="#6366F1" bg="#EEF2FF"
          onClick={onGoPres} />
        <StatCard icon={Activity} label="Active Rx"
          value={activeRx.length} color="#A855F7" bg="#FAF5FF"
          onClick={onGoPres} />
        <StatCard icon={Brain} label="AI Logs"
          value={diagnosisLogs.length} color="#B45309" bg="#FEF3C7"
          onClick={onGoAI} />
      </div>

      {/* Upcoming appointments */}
      <div style={c.card}>
        <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600,
                       color: "#0F172A", margin: 0 }}>
            Upcoming Appointments
          </h3>
          <button
            onClick={onBook}
            style={{ ...c.btn, padding: "8px 16px",
                     fontSize: "13px" }}
          >
            <Plus size={14} />
            Book New
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <Calendar size={32} color="#CBD5E1"
                      style={{ marginBottom: "10px" }} />
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
              No upcoming appointments
            </p>
            <button onClick={onBook}
                    style={{ ...c.btn, marginTop: "12px",
                             padding: "8px 20px", fontSize: "13px" }}>
              Book an appointment
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column",
                        gap: "10px" }}>
            {upcoming.slice(0, 3).map((appt) => (
              <div key={appt.id} style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                padding:        "14px 16px",
                background:     "#F8FAFC",
                borderRadius:   "12px",
                border:         "1px solid #E2E8F0",
                flexWrap:       "wrap",
                gap:            "10px",
              }}>
                <div style={{ display: "flex",
                              alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width:          "40px", height: "40px",
                    borderRadius:   "12px", background: "#F0FDFA",
                    display:        "flex", alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Calendar size={18} color="#0F766E" />
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600,
                                color: "#0F172A", margin: 0 }}>
                      {new Date(appt.date).toLocaleDateString("en-PK", {
                        weekday: "short", month: "short",
                        day:     "numeric",
                      })}
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748B",
                                margin: "2px 0 0" }}>
                      {new Date(appt.date).toLocaleTimeString("en-PK", {
                        hour: "2-digit", minute: "2-digit",
                      })} · {getDoctorName(appt.doctorId)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={appt.status} />
              </div>
            ))}
            {upcoming.length > 3 && (
              <button onClick={onGoAppts}
                      style={{ ...c.btnSec, justifyContent: "center",
                               width: "100%" }}>
                View all {upcoming.length} appointments
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recent prescriptions */}
      <div style={c.card}>
        <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600,
                       color: "#0F172A", margin: 0 }}>
            Recent Prescriptions
          </h3>
          {prescriptions.length > 0 && (
            <button onClick={onGoPres}
                    style={{ ...c.btnSec, fontSize: "13px",
                             padding: "7px 14px" }}>
              View all
              <ChevronRight size={13} />
            </button>
          )}
        </div>

        {prescriptions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <FileText size={28} color="#CBD5E1"
                      style={{ marginBottom: "8px" }} />
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
              No prescriptions yet
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column",
                        gap: "10px" }}>
            {prescriptions.slice(0, 3).map((pres) => {
              const meds = Array.isArray(pres.medicines)
                ? pres.medicines : [];
              return (
                <div key={pres.id} style={{
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "space-between",
                  padding:      "12px 16px",
                  background:   "#F8FAFC",
                  borderRadius: "12px",
                  border:       "1px solid #E2E8F0",
                  flexWrap:     "wrap",
                  gap:          "8px",
                }}>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 500,
                                color: "#0F172A", margin: 0 }}>
                      {meds.slice(0, 2).map((m) => m.name).join(", ")}
                      {meds.length > 2 && ` +${meds.length - 2} more`}
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748B",
                                margin: "2px 0 0" }}>
                      {getDoctorName(pres.doctorId)}
                    </p>
                  </div>
                  <StatusBadge status={pres.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI health summary */}
      {diagnosisLogs.length > 0 && (
        <div style={{
          ...c.card,
          background: "linear-gradient(135deg,#EEF2FF,#F0FDFA)",
          border:     "1px solid #C7D2FE",
        }}>
          <div style={{ display: "flex", alignItems: "center",
                        gap: "10px", marginBottom: "14px" }}>
            <Brain size={18} color="#6366F1" />
            <h3 style={{ fontSize: "15px", fontWeight: 600,
                         color: "#0F172A", margin: 0 }}>
              Latest AI Diagnosis Summary
            </h3>
          </div>
          {(() => {
            const latest = diagnosisLogs[0];
            let parsed = null;
            try { parsed = JSON.parse(latest.aiResponse); } catch {}
            return (
              <div>
                <p style={{ fontSize: "13px", color: "#475569",
                            margin: "0 0 10px" }}>
                  <strong>Symptoms:</strong> {latest.symptoms}
                </p>
                {parsed?.summary && (
                  <p style={{ fontSize: "13px", color: "#475569",
                              margin: "0 0 10px",
                              lineHeight: 1.6 }}>
                    {parsed.summary}
                  </p>
                )}
                {parsed?.possibleConditions?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap",
                                gap: "6px" }}>
                    {parsed.possibleConditions.map((cond, i) => (
                      <span key={i} style={{
                        padding:      "4px 10px",
                        borderRadius: "20px",
                        fontSize:     "12px",
                        fontWeight:   500,
                        background:   "#EEF2FF",
                        color:        "#4F46E5",
                      }}>
                        {cond}
                      </span>
                    ))}
                  </div>
                )}
                <button onClick={onGoAI}
                        style={{ ...c.btnSec, marginTop: "14px",
                                 fontSize: "13px" }}>
                  View all AI insights
                  <ChevronRight size={13} />
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// APPOINTMENTS TAB
// ─────────────────────────────────────────────
function AppointmentsTab({
  appointments, getDoctorName,
  onBook, onCancel, onReschedule, onRefresh,
}) {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all"
    ? appointments
    : appointments.filter((a) => a.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700,
                       color: "#0F172A", margin: 0 }}>
            My Appointments
          </h2>
          <p style={{ fontSize: "13px", color: "#94A3B8",
                      margin: "4px 0 0" }}>
            {appointments.length} total
          </p>
        </div>
        <button onClick={onBook} style={c.btn}>
          <Plus size={15} />
          Book Appointment
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { key: "all",       label: `All (${appointments.length})` },
          { key: "pending",   label: `Pending (${appointments.filter(a=>a.status==="pending").length})` },
          { key: "confirmed", label: `Confirmed (${appointments.filter(a=>a.status==="confirmed").length})` },
          { key: "completed", label: `Completed (${appointments.filter(a=>a.status==="completed").length})` },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{
                    padding:      "7px 16px",
                    borderRadius: "20px",
                    fontSize:     "13px",
                    fontWeight:   filter === f.key ? 600 : 400,
                    cursor:       "pointer",
                    border:       filter === f.key
                      ? "2px solid #0F766E" : "1px solid #E2E8F0",
                    background:   filter === f.key ? "#F0FDFA" : "#FFFFFF",
                    color:        filter === f.key ? "#0F766E" : "#64748B",
                  }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Appointment cards */}
      {filtered.length === 0 ? (
        <div style={{ ...c.card, textAlign: "center", padding: "50px" }}>
          <Calendar size={36} color="#CBD5E1"
                    style={{ marginBottom: "12px" }} />
          <p style={{ color: "#475569", fontSize: "15px",
                      fontWeight: 500, margin: 0 }}>
            No appointments found
          </p>
          <button onClick={onBook}
                  style={{ ...c.btn, marginTop: "16px",
                           display: "inline-flex" }}>
            Book one now
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column",
                      gap: "12px" }}>
          {filtered.map((appt) => {
            const isUpcoming =
              appt.status === "pending" ||
              appt.status === "confirmed";
            const apptDate = new Date(appt.date);

            return (
              <div key={appt.id} style={c.card}>
                <div style={{ display: "flex",
                              justifyContent: "space-between",
                              alignItems:     "flex-start",
                              flexWrap:       "wrap",
                              gap:            "12px" }}>

                  {/* Left — date + doctor */}
                  <div style={{ display: "flex",
                                alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width:          "52px", height: "52px",
                      borderRadius:   "14px", background: "#F0FDFA",
                      display:        "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0,
                      flexDirection:  "column",
                    }}>
                      <p style={{ fontSize: "18px", fontWeight: 700,
                                  color: "#0F766E", margin: 0,
                                  lineHeight: 1 }}>
                        {apptDate.getDate()}
                      </p>
                      <p style={{ fontSize: "10px", fontWeight: 600,
                                  color: "#14B8A6", margin: 0,
                                  textTransform: "uppercase" }}>
                        {apptDate.toLocaleDateString("en-PK",
                          { month: "short" })}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 600,
                                  color: "#0F172A", margin: 0 }}>
                        {getDoctorName(appt.doctorId)}
                      </p>
                      <p style={{ fontSize: "13px", color: "#64748B",
                                  margin: "3px 0 0" }}>
                        {apptDate.toLocaleTimeString("en-PK", {
                          hour: "2-digit", minute: "2-digit",
                        })} ·{" "}
                        {apptDate.toLocaleDateString("en-PK", {
                          weekday: "long",
                        })}
                      </p>
                      <p style={{ fontSize: "11px", color: "#94A3B8",
                                  margin: "3px 0 0" }}>
                        Appointment #{appt.id}
                      </p>
                    </div>
                  </div>

                  {/* Right — status + actions */}
                  <div style={{ display: "flex", flexDirection: "column",
                                alignItems: "flex-end", gap: "8px" }}>
                    <StatusBadge status={appt.status} />

                    {isUpcoming && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => onReschedule(appt)}
                          style={{ ...c.btnSec, padding: "6px 12px",
                                   fontSize: "12px" }}
                        >
                          <Pencil size={12} />
                          Reschedule
                        </button>
                        <button
                          onClick={() => onCancel(appt.id)}
                          style={{
                            ...c.btnSec,
                            padding:    "6px 12px",
                            fontSize:   "12px",
                            color:      "#DC2626",
                            border:     "1px solid #FECACA",
                            background: "#FEE2E2",
                          }}
                        >
                          <X size={12} />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PRESCRIPTIONS TAB
// ─────────────────────────────────────────────
function PrescriptionsTab({
  prescriptions, getDoctorName,
  onDownload, downloading, onAI, onView,
}) {
  if (prescriptions.length === 0) {
    return (
      <div style={{ ...c.card, textAlign: "center", padding: "60px" }}>
        <FileText size={36} color="#CBD5E1"
                  style={{ marginBottom: "14px" }} />
        <p style={{ fontSize: "16px", fontWeight: 500,
                    color: "#475569", margin: 0 }}>
          No prescriptions yet
        </p>
        <p style={{ fontSize: "13px", color: "#94A3B8",
                    marginTop: "8px" }}>
          Your prescriptions will appear here after your doctor visits
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700,
                     color: "#0F172A", margin: 0 }}>
          My Prescriptions
        </h2>
        <p style={{ fontSize: "13px", color: "#94A3B8",
                    margin: "4px 0 0" }}>
          {prescriptions.length} prescription
          {prescriptions.length !== 1 ? "s" : ""} issued
        </p>
      </div>

      {prescriptions.map((pres) => {
        const medicines = Array.isArray(pres.medicines)
          ? pres.medicines : [];
        const isDown = downloading === pres.id;

        return (
          <div key={pres.id} style={c.card}>

            {/* Header */}
            <div style={{ display: "flex",
                          justifyContent: "space-between",
                          alignItems:     "flex-start",
                          marginBottom:   "16px",
                          flexWrap:       "wrap",
                          gap:            "10px" }}>
              <div style={{ display: "flex",
                            alignItems: "center", gap: "12px" }}>
                <div style={{
                  width:          "44px", height: "44px",
                  borderRadius:   "12px", background: "#EEF2FF",
                  display:        "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  <FileText size={20} color="#6366F1" />
                </div>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 600,
                              color: "#0F172A", margin: 0 }}>
                    Prescription #{pres.id}
                  </p>
                  <p style={{ fontSize: "12px", color: "#94A3B8",
                              margin: "3px 0 0" }}>
                    {getDoctorName(pres.doctorId)} ·{" "}
                    {new Date(pres.createdAt).toLocaleDateString("en-PK", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <StatusBadge status={pres.status} />
            </div>

            {/* Medicines */}
            <div style={{ display: "flex", flexWrap: "wrap",
                          gap: "8px", marginBottom: "14px" }}>
              {medicines.map((med, i) => (
                <span key={i} style={{
                  display:      "inline-flex",
                  alignItems:   "center",
                  gap:          "6px",
                  padding:      "6px 12px",
                  borderRadius: "20px",
                  fontSize:     "12px",
                  fontWeight:   500,
                  background:   "#F0FDFA",
                  color:        "#0F766E",
                  border:       "1px solid #CCFBF1",
                }}>
                  <Pill size={11} />
                  {med.name}
                  {med.dosage && (
                    <span style={{ color: "#64748B",
                                   fontWeight: 400 }}>
                      · {med.dosage}
                    </span>
                  )}
                </span>
              ))}
            </div>

            {/* Instructions */}
            {pres.instructions && (
              <div style={{
                padding:      "10px 14px",
                background:   "#FFFBEB",
                borderRadius: "10px",
                border:       "1px solid #FDE68A",
                marginBottom: "14px",
              }}>
                <p style={{ fontSize: "11px", fontWeight: 600,
                            color: "#B45309", margin: "0 0 4px",
                            textTransform: "uppercase" }}>
                  Instructions
                </p>
                <p style={{ fontSize: "13px", color: "#475569",
                            margin: 0, lineHeight: 1.6 }}>
                  {pres.instructions}
                </p>
              </div>
            )}

            {/* AI explanation preview */}
            {pres.aiExplanation && (
              <div style={{
                padding:      "10px 14px",
                background:   "#EEF2FF",
                borderRadius: "10px",
                border:       "1px solid #C7D2FE",
                marginBottom: "14px",
              }}>
                <p style={{ fontSize: "11px", fontWeight: 600,
                            color: "#6366F1", margin: "0 0 4px",
                            display: "flex", alignItems: "center",
                            gap: "5px", textTransform: "uppercase" }}>
                  <Sparkles size={11} />
                  AI Explanation
                </p>
                <p style={{ fontSize: "13px", color: "#475569",
                            margin: 0, lineHeight: 1.6,
                            whiteSpace: "pre-line",
                            display:    "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden" }}>
                  {pres.aiExplanation}
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{
              display:    "flex",
              gap:        "10px",
              paddingTop: "14px",
              borderTop:  "1px solid #E2E8F0",
              flexWrap:   "wrap",
            }}>
              <button onClick={() => onView(pres)}
                      style={{ ...c.btnSec, flex: 1,
                               justifyContent: "center" }}>
                <Eye size={14} />
                View Details
              </button>
              <button onClick={() => onDownload(pres.id)}
                      disabled={isDown}
                      style={{ ...c.btn, flex: 1,
                               justifyContent: "center",
                               opacity: isDown ? 0.7 : 1 }}>
                {isDown ? (
                  <>
                    <Loader size={14}
                            style={{ animation:
                              "spin 0.8s linear infinite" }} />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    Download PDF
                  </>
                )}
              </button>
              <button onClick={() => onAI(pres)}
                      style={{
                        ...c.btnSec,
                        flex:       1,
                        justifyContent: "center",
                        background: "#EEF2FF",
                        border:     "1px solid #C7D2FE",
                        color:      "#6366F1",
                      }}>
                <Sparkles size={14} />
                AI Explain
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// AI & HEALTH TAB
// ─────────────────────────────────────────────
function AITab({
  prescriptions, diagnosisLogs,
  getDoctorName, isPro, onAI,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700,
                     color: "#0F172A", margin: 0 }}>
          AI & Health Insights
        </h2>
        <p style={{ fontSize: "13px", color: "#94A3B8",
                    margin: "4px 0 0" }}>
          AI-generated explanations and diagnosis summaries
        </p>
      </div>

      {/* Prescription AI explanations */}
      <div style={c.card}>
        <div style={{ display: "flex", alignItems: "center",
                      gap: "10px", marginBottom: "16px" }}>
          <div style={{ width: "36px", height: "36px",
                        borderRadius: "10px", background: "#EEF2FF",
                        display: "flex", alignItems: "center",
                        justifyContent: "center" }}>
            <Sparkles size={18} color="#6366F1" />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 600,
                         color: "#0F172A", margin: 0 }}>
              Prescription Explanations
            </h3>
            <p style={{ fontSize: "12px", color: "#94A3B8",
                        margin: "2px 0 0" }}>
              Understand your medicines in simple language
            </p>
          </div>
        </div>

        {prescriptions.length === 0 ? (
          <p style={{ color: "#94A3B8", fontSize: "14px",
                      textAlign: "center", padding: "20px 0" }}>
            No prescriptions to explain yet
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column",
                        gap: "10px" }}>
            {prescriptions.map((pres) => {
              const meds = Array.isArray(pres.medicines)
                ? pres.medicines : [];
              return (
                <div key={pres.id} style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  padding:        "12px 16px",
                  background:     "#F8FAFC",
                  borderRadius:   "12px",
                  border:         "1px solid #E2E8F0",
                  flexWrap:       "wrap",
                  gap:            "10px",
                }}>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 500,
                                color: "#0F172A", margin: 0 }}>
                      Prescription #{pres.id}
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748B",
                                margin: "2px 0 0" }}>
                      {meds.slice(0,2).map(m=>m.name).join(", ")}
                      {meds.length > 2 && ` +${meds.length-2} more`}
                    </p>
                    {pres.aiExplanation && (
                      <span style={{ fontSize: "11px", color: "#6366F1",
                                     fontWeight: 500 }}>
                        ✓ AI explanation available
                      </span>
                    )}
                  </div>
                  <button onClick={() => onAI(pres)}
                          style={{
                            ...c.btnSec,
                            padding:    "7px 14px",
                            fontSize:   "12px",
                            background: "#EEF2FF",
                            border:     "1px solid #C7D2FE",
                            color:      "#6366F1",
                          }}>
                    <Sparkles size={13} />
                    {pres.aiExplanation ? "Re-explain" : "Explain"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Diagnosis logs from doctor */}
      <div style={c.card}>
        <div style={{ display: "flex", alignItems: "center",
                      gap: "10px", marginBottom: "16px" }}>
          <div style={{ width: "36px", height: "36px",
                        borderRadius: "10px", background: "#FEF3C7",
                        display: "flex", alignItems: "center",
                        justifyContent: "center" }}>
            <Brain size={18} color="#B45309" />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 600,
                         color: "#0F172A", margin: 0 }}>
              Diagnosis Summaries
            </h3>
            <p style={{ fontSize: "12px", color: "#94A3B8",
                        margin: "2px 0 0" }}>
              AI analysis shared by your doctor
            </p>
          </div>
        </div>

        {diagnosisLogs.length === 0 ? (
          <p style={{ color: "#94A3B8", fontSize: "14px",
                      textAlign: "center", padding: "20px 0" }}>
            No diagnosis summaries yet
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column",
                        gap: "12px" }}>
            {diagnosisLogs.map((log) => {
              let parsed = null;
              try { parsed = JSON.parse(log.aiResponse); } catch {}

              const riskColors = {
                low:    { bg: "#DCFCE7", color: "#15803D" },
                medium: { bg: "#FEF3C7", color: "#B45309" },
                high:   { bg: "#FEE2E2", color: "#DC2626" },
              };
              const rc = riskColors[log.riskLevel] ||
                riskColors.low;

              return (
                <div key={log.id} style={{
                  padding:      "16px",
                  background:   "#F8FAFC",
                  borderRadius: "12px",
                  border:       "1px solid #E2E8F0",
                }}>
                  {/* Header row */}
                  <div style={{ display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "12px",
                                flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600,
                                  color: "#0F172A", margin: 0 }}>
                        Diagnosis #{log.id}
                      </p>
                      <p style={{ fontSize: "12px", color: "#94A3B8",
                                  margin: "2px 0 0" }}>
                        {new Date(log.createdAt).toLocaleDateString(
                          "en-PK", { day: "numeric",
                                     month: "short", year: "numeric" }
                        )}
                      </p>
                    </div>
                    <span style={{
                      padding:      "3px 10px",
                      borderRadius: "20px",
                      fontSize:     "12px",
                      fontWeight:   600,
                      background:   rc.bg,
                      color:        rc.color,
                    }}>
                      {log.riskLevel} risk
                    </span>
                  </div>

                  {/* Symptoms */}
                  <div style={{ marginBottom: "10px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600,
                                color: "#94A3B8", textTransform: "uppercase",
                                margin: "0 0 4px", letterSpacing: "0.04em" }}>
                      Symptoms
                    </p>
                    <p style={{ fontSize: "13px", color: "#475569",
                                margin: 0, lineHeight: 1.6 }}>
                      {log.symptoms}
                    </p>
                  </div>

                  {/* Summary from AI */}
                  {parsed?.summary && (
                    <div style={{
                      padding:      "10px 12px",
                      background:   "#FFFFFF",
                      borderRadius: "8px",
                      border:       "1px solid #E2E8F0",
                      marginBottom: "10px",
                    }}>
                      <p style={{ fontSize: "13px", color: "#475569",
                                  margin: 0, lineHeight: 1.6 }}>
                        {parsed.summary}
                      </p>
                    </div>
                  )}

                  {/* Conditions */}
                  {parsed?.possibleConditions?.length > 0 && (
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: 600,
                                  color: "#94A3B8", textTransform: "uppercase",
                                  margin: "0 0 6px" }}>
                        Possible Conditions
                      </p>
                      <div style={{ display: "flex",
                                    flexWrap: "wrap", gap: "6px" }}>
                        {parsed.possibleConditions.map((cond, i) => (
                          <span key={i} style={{
                            padding:      "4px 10px",
                            borderRadius: "20px",
                            fontSize:     "12px",
                            fontWeight:   500,
                            background:   "#EEF2FF",
                            color:        "#4F46E5",
                          }}>
                            {cond}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────────
function ProfileTab({ user, updateUser }) {
  const [profileTab, setProfileTab] = useState("info");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700,
                     color: "#0F172A", margin: 0 }}>
          My Profile
        </h2>
        <p style={{ fontSize: "13px", color: "#94A3B8",
                    margin: "4px 0 0" }}>
          Manage your account and security
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: "8px" }}>
        {[
          { key: "info",     label: "Account Info" },
          { key: "password", label: "Change Password" },
        ].map((t) => (
          <button key={t.key} onClick={() => setProfileTab(t.key)}
                  style={{
                    padding:      "8px 18px",
                    borderRadius: "10px",
                    border:       "none",
                    fontSize:     "14px",
                    fontWeight:   profileTab === t.key ? 600 : 400,
                    cursor:       "pointer",
                    background:   profileTab === t.key
                      ? "linear-gradient(135deg,#0F766E,#6366F1)"
                      : "#F1F5F9",
                    color:        profileTab === t.key
                      ? "#FFFFFF" : "#64748B",
                  }}>
            {t.label}
          </button>
        ))}
      </div>

      {profileTab === "info" && (
        <ProfileInfoTab user={user} updateUser={updateUser} />
      )}
      {profileTab === "password" && (
        <ChangePasswordTab />
      )}
    </div>
  );
}

function ProfileInfoTab({ user, updateUser }) {
  const [form, setForm] = useState({
    firstName:  user?.firstName || "",
    lastName:   user?.lastName  || "",
    phone:      user?.phone     || "",
    // ── Medical fields ──
    age:        "",
    gender:     "",
    bloodGroup: "",
    address:    "",
  });
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");

  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  // ── Load existing Patient record to pre-fill medical fields ──
  useEffect(() => {
    const loadMedical = async () => {
      try {
        // Get patient's own record via unified endpoint isn't available
        // to patients — fetch directly
        const res = await patientAPI.getAll();
        const all  = res.data.data || [];
        // Find record linked to this user
        const mine = all.find(
          (p) => String(p.userId) === String(user.id) ||
                 p.email?.toLowerCase() === user.email?.toLowerCase()
        );
        if (mine) {
          setForm((prev) => ({
            ...prev,
            age:        mine.age        || "",
            gender:     mine.gender     || "",
            bloodGroup: mine.bloodGroup || "",
            address:    mine.address    || "",
          }));
        }
      } catch {
        // Silently ignore — medical fields just start empty
      } finally {
        setLoading(false);
      }
    };
    loadMedical();
  }, [user.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required"); return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await authAPI.updateProfile({
        firstName:  form.firstName,
        lastName:   form.lastName,
        phone:      form.phone,
        // ── Medical fields passed to backend ──
        age:        form.age,
        gender:     form.gender,
        bloodGroup: form.bloodGroup,
        address:    form.address,
      });
      updateUser(res.data.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ ...c.card, textAlign: "center", padding: "40px" }}>
        <div style={{
          width: "28px", height: "28px",
          border: "3px solid #E2E8F0",
          borderTopColor: "#0F766E",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 12px",
        }} />
        <p style={{ color: "#94A3B8", fontSize: "13px" }}>
          Loading your profile...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px" }}>

      {/* Avatar card */}
      <div style={{ ...c.card, gridColumn: "1 / -1",
                    display: "flex", alignItems: "center",
                    gap: "20px", flexWrap: "wrap" }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "18px",
          background: "linear-gradient(135deg,#FAF5FF,#EEF2FF)",
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "22px",
          fontWeight: 700, color: "#A855F7", flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: "18px", fontWeight: 700,
                      color: "#0F172A", margin: 0 }}>
            {user?.firstName} {user?.lastName}
          </p>
          <p style={{ fontSize: "13px", color: "#64748B",
                      margin: "4px 0 0" }}>
            Patient · {user?.email}
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ ...c.card, gridColumn: "1 / -1" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600,
                     color: "#0F172A", margin: "0 0 20px" }}>
          Update Profile
        </h3>

        {success && (
          <div style={{
            background: "#DCFCE7", border: "1px solid #BBF7D0",
            borderRadius: "10px", padding: "12px 16px",
            marginBottom: "16px", color: "#15803D",
            fontSize: "13px", display: "flex",
            alignItems: "center", gap: "8px",
          }}>
            <CheckCircle2 size={14} />
            Profile updated successfully
          </div>
        )}

        {error && (
          <div style={{
            background: "#FEE2E2", border: "1px solid #FECACA",
            borderRadius: "10px", padding: "12px 16px",
            marginBottom: "16px", color: "#DC2626",
            fontSize: "13px", display: "flex",
            alignItems: "center", gap: "8px",
          }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column",
                       gap: "14px" }}>

          {/* ── Account Info ── */}
          <div style={{ display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px" }}>
            <div>
              <label style={c.label}>First Name *</label>
              <input style={c.input} value={form.firstName}
                onChange={(e) => setForm((p) =>
                  ({ ...p, firstName: e.target.value }))} />
            </div>
            <div>
              <label style={c.label}>Last Name *</label>
              <input style={c.input} value={form.lastName}
                onChange={(e) => setForm((p) =>
                  ({ ...p, lastName: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={c.label}>Email (read-only)</label>
            <input style={{ ...c.input, opacity: 0.6,
                            cursor: "not-allowed" }}
                   value={user?.email || ""} disabled />
          </div>

          <div>
            <label style={c.label}>Phone</label>
            <input style={c.input} value={form.phone}
              placeholder="+92 300 0000000"
              onChange={(e) => setForm((p) =>
                ({ ...p, phone: e.target.value }))} />
          </div>

          {/* ── Medical Info divider ── */}
          <div style={{ display: "flex", alignItems: "center",
                        gap: "12px", margin: "4px 0" }}>
            <div style={{ flex: 1, height: "1px",
                          background: "#E2E8F0" }} />
            <span style={{ fontSize: "11px", fontWeight: 600,
                           color: "#94A3B8", textTransform: "uppercase",
                           letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
              Medical Information
            </span>
            <div style={{ flex: 1, height: "1px",
                          background: "#E2E8F0" }} />
          </div>

          {/* ── Medical fields ── */}
          <div style={{ display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px" }}>
            <div>
              <label style={c.label}>Age</label>
              <input type="number" min="0" max="120" style={c.input}
                placeholder="e.g. 28" value={form.age}
                onChange={(e) => setForm((p) =>
                  ({ ...p, age: e.target.value }))} />
            </div>
            <div>
              <label style={c.label}>Gender</label>
              <select style={{ ...c.input, cursor: "pointer" }}
                value={form.gender}
                onChange={(e) => setForm((p) =>
                  ({ ...p, gender: e.target.value }))}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={c.label}>Blood Group</label>
              <select style={{ ...c.input, cursor: "pointer" }}
                value={form.bloodGroup}
                onChange={(e) => setForm((p) =>
                  ({ ...p, bloodGroup: e.target.value }))}>
                <option value="">Select</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={c.label}>Address</label>
              <input style={c.input}
                placeholder="House 12, Street 4, Lahore"
                value={form.address}
                onChange={(e) => setForm((p) =>
                  ({ ...p, address: e.target.value }))} />
            </div>
          </div>

          <button type="submit" disabled={saving}
                  style={{ ...c.btn, width: "fit-content",
                           padding: "10px 24px",
                           opacity: saving ? 0.7 : 1 }}>
            {saving ? (
              <>
                <span style={{
                  width: "14px", height: "14px",
                  border: "2px solid #ffffff40",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save All Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function ChangePasswordTab() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });
  const [show,    setShow]    = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match"); return;
    }
    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters"); return;
    }
    setLoading(true);
    setError("");
    try {
      await authAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...c.card, maxWidth: "480px" }}>
      <div style={{ display: "flex", alignItems: "center",
                    gap: "10px", marginBottom: "20px" }}>
        <div style={{ width: "36px", height: "36px",
                      borderRadius: "10px", background: "#EEF2FF",
                      display: "flex", alignItems: "center",
                      justifyContent: "center" }}>
          <Lock size={18} color="#6366F1" />
        </div>
        <h3 style={{ fontSize: "15px", fontWeight: 600,
                     color: "#0F172A", margin: 0 }}>
          Change Password
        </h3>
      </div>

      {success && (
        <div style={{ background: "#DCFCE7",
                      border: "1px solid #BBF7D0",
                      borderRadius: "10px", padding: "12px 16px",
                      marginBottom: "16px", color: "#15803D",
                      fontSize: "13px", display: "flex",
                      alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={14} />
          Password changed successfully
        </div>
      )}

      {error && (
        <div style={{ background: "#FEE2E2",
                      border: "1px solid #FECACA",
                      borderRadius: "10px", padding: "12px 16px",
                      marginBottom: "16px", color: "#DC2626",
                      fontSize: "13px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column",
                     gap: "14px" }}>
        {[
          { name: "currentPassword", label: "Current Password" },
          { name: "newPassword",     label: "New Password"     },
          { name: "confirmPassword", label: "Confirm Password" },
        ].map((field) => (
          <div key={field.name}>
            <label style={c.label}>{field.label}</label>
            <div style={{ position: "relative" }}>
              <input
                type={show[field.name] ? "text" : "password"}
                style={{ ...c.input, paddingRight: "44px" }}
                placeholder="••••••••"
                value={form[field.name]}
                onChange={(e) =>
                  setForm(p => ({...p, [field.name]: e.target.value}))
                }
              />
              <button type="button"
                      onClick={() => setShow(p =>
                        ({...p, [field.name]: !p[field.name]}))}
                      style={{ position: "absolute", right: "14px",
                               top: "50%", transform: "translateY(-50%)",
                               background: "none", border: "none",
                               cursor: "pointer", color: "#94A3B8" }}>
                {show[field.name]
                  ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        ))}
        <button type="submit" disabled={loading}
                style={{ ...c.btn, width: "fit-content",
                         padding: "10px 24px",
                         opacity: loading ? 0.7 : 1 }}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}


// ─────────────────────────────────────────────
// RESCHEDULE MODAL
// ─────────────────────────────────────────────
function RescheduleModal({ appointment, onClose, onSaved }) {
  const [date,    setDate]    = useState(
    appointment.date
      ? new Date(appointment.date).toISOString().slice(0, 16)
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) { setError("Please select a new date"); return; }
    setLoading(true);
    try {
      const res = await appointmentAPI.update(appointment.id, { date });
      onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Reschedule failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Reschedule Appointment"
           subtitle={`Appointment #${appointment.id}`}
           onClose={onClose}>
      {error && <ErrorBox msg={error} />}
      <form onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column",
                     gap: "14px" }}>
        <div>
          <label style={c.label}>New Date & Time *</label>
          <input type="datetime-local" style={c.input}
            value={date}
            onChange={(e) => setDate(e.target.value)} />
        </div>
        <ModalButtons onClose={onClose} loading={loading}
                      submitLabel="Reschedule" />
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// VIEW PRESCRIPTION MODAL
// ─────────────────────────────────────────────
function ViewPrescriptionModal({
  prescription, getDoctorName,
  onClose, onDownload, downloading, onAI,
}) {
  const medicines = Array.isArray(prescription.medicines)
    ? prescription.medicines : [];
  const isDown = downloading === prescription.id;

  return (
    <Modal title={`Prescription #${prescription.id}`}
           subtitle={new Date(prescription.createdAt)
             .toLocaleDateString("en-PK", {
               day: "numeric", month: "long", year: "numeric",
             })}
           onClose={onClose} wide>
      {/* Doctor + status */}
      <div style={{ display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px", marginBottom: "16px" }}>
        <div style={{ padding: "12px 14px", background: "#F0FDFA",
                      borderRadius: "10px", border: "1px solid #CCFBF1" }}>
          <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>
            Prescribed by
          </p>
          <p style={{ fontSize: "14px", fontWeight: 600,
                      color: "#0F172A", margin: "4px 0 0" }}>
            {getDoctorName(prescription.doctorId)}
          </p>
        </div>
        <div style={{ padding: "12px 14px", background: "#F8FAFC",
                      borderRadius: "10px", border: "1px solid #E2E8F0",
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between" }}>
          <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>
            Status
          </p>
          <StatusBadge status={prescription.status} />
        </div>
      </div>

      {/* Medicines */}
      <div style={{ marginBottom: "14px" }}>
        <p style={{ ...c.label, marginBottom: "8px" }}>
          Medicines ({medicines.length})
        </p>
        <div style={{ display: "flex", flexDirection: "column",
                      gap: "8px" }}>
          {medicines.map((med, i) => (
            <div key={i} style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "12px",
              padding:      "12px 14px",
              background:   "#F8FAFC",
              borderRadius: "10px",
              border:       "1px solid #E2E8F0",
            }}>
              <div style={{ width: "32px", height: "32px",
                            borderRadius: "10px", background: "#F0FDFA",
                            display: "flex", alignItems: "center",
                            justifyContent: "center", flexShrink: 0 }}>
                <Pill size={14} color="#0F766E" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", fontWeight: 600,
                            color: "#0F172A", margin: 0 }}>
                  {med.name}
                  {med.dosage && (
                    <span style={{ fontSize: "12px", fontWeight: 400,
                                   color: "#94A3B8", marginLeft: "8px" }}>
                      {med.dosage}
                    </span>
                  )}
                </p>
                {(med.frequency || med.duration) && (
                  <p style={{ fontSize: "12px", color: "#64748B",
                              margin: "3px 0 0" }}>
                    {[med.frequency, med.duration].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {prescription.instructions && (
        <div style={{ padding: "12px 14px", background: "#FFFBEB",
                      borderRadius: "10px", border: "1px solid #FDE68A",
                      marginBottom: "14px" }}>
          <p style={{ ...c.label, color: "#B45309",
                      marginBottom: "6px" }}>
            Instructions
          </p>
          <p style={{ fontSize: "13px", color: "#475569",
                      margin: 0, lineHeight: 1.6 }}>
            {prescription.instructions}
          </p>
        </div>
      )}

      {/* AI explanation */}
      {prescription.aiExplanation && (
        <div style={{ padding: "12px 14px", background: "#EEF2FF",
                      borderRadius: "10px", border: "1px solid #C7D2FE",
                      marginBottom: "14px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600,
                      color: "#6366F1", margin: "0 0 6px",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                      display: "flex", alignItems: "center", gap: "5px" }}>
            <Sparkles size={11} />
            AI Explanation
          </p>
          <p style={{ fontSize: "13px", color: "#475569",
                      margin: 0, lineHeight: 1.7,
                      whiteSpace: "pre-line" }}>
            {prescription.aiExplanation}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px",
                    borderTop: "1px solid #E2E8F0",
                    paddingTop: "16px", flexWrap: "wrap" }}>
        <button onClick={() => { onClose(); onAI(prescription); }}
                style={{ ...c.btnSec, flex: 1, justifyContent: "center",
                         background: "#EEF2FF", border: "1px solid #C7D2FE",
                         color: "#6366F1" }}>
          <Sparkles size={14} />
          AI Explain
        </button>
        <button onClick={() => onDownload(prescription.id)}
                disabled={isDown}
                style={{ ...c.btn, flex: 1, justifyContent: "center",
                         opacity: isDown ? 0.7 : 1 }}>
          {isDown ? (
            <>
              <Loader size={14}
                      style={{ animation: "spin 0.8s linear infinite" }} />
              Downloading...
            </>
          ) : (
            <>
              <Download size={14} />
              Download PDF
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// AI EXPLANATION MODAL
// ─────────────────────────────────────────────
function AIExplanationModal({ prescription, onClose }) {
  const [language,    setLanguage]    = useState("english");
  const [explanation, setExplanation] = useState(
    prescription.aiExplanation || ""
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const medicines = Array.isArray(prescription.medicines)
    ? prescription.medicines : [];

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await aiAPI.prescriptionExplanation({
        medicines,
        instructions:   prescription.instructions || "",
        language,
        prescriptionId: prescription.id,
      });
      setExplanation(res.data.data.explanation);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "AI explanation failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="AI Explanation"
           subtitle={`Prescription #${prescription.id}`}
           onClose={onClose} wide>

      {/* Medicines preview */}
      <div style={{ padding: "12px 16px", background: "#F8FAFC",
                    borderRadius: "10px", border: "1px solid #E2E8F0",
                    marginBottom: "16px" }}>
        <p style={{ ...c.label, marginBottom: "8px" }}>
          Medicines in this prescription
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {medicines.map((med, i) => (
            <span key={i} style={{
              padding: "4px 10px", borderRadius: "20px",
              fontSize: "12px", fontWeight: 500,
              background: "#F0FDFA", color: "#0F766E",
            }}>
              {med.name} {med.dosage && `· ${med.dosage}`}
            </span>
          ))}
        </div>
      </div>

      {/* Language */}
      <div style={{ marginBottom: "16px" }}>
        <p style={{ ...c.label, marginBottom: "10px" }}>
          Choose language
        </p>
        <div style={{ display: "grid",
                      gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[
            { key: "english", label: "English", sub: "Plain English" },
            { key: "urdu",    label: "اردو",    sub: "Urdu" },
          ].map((lang) => (
            <button key={lang.key} onClick={() => setLanguage(lang.key)}
                    style={{
                      padding:      "14px",
                      borderRadius: "12px",
                      border:       language === lang.key
                        ? "2px solid #6366F1" : "1px solid #E2E8F0",
                      background:   language === lang.key
                        ? "#EEF2FF" : "#F8FAFC",
                      cursor:       "pointer",
                      textAlign:    "center",
                    }}>
              <p style={{ fontSize: "18px", margin: 0, fontWeight: 700,
                          color: language === lang.key
                            ? "#6366F1" : "#0F172A" }}>
                {lang.label}
              </p>
              <p style={{ fontSize: "11px", margin: "4px 0 0",
                          color: language === lang.key
                            ? "#6366F1" : "#94A3B8" }}>
                {lang.sub}
              </p>
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBox msg={error} />}

      {/* Generate button */}
      <button onClick={handleGenerate} disabled={loading}
              style={{ ...c.btn, width: "100%",
                       justifyContent: "center",
                       opacity: loading ? 0.7 : 1,
                       marginBottom: "16px" }}>
        {loading ? (
          <>
            <Loader size={15}
                    style={{ animation: "spin 0.8s linear infinite" }} />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={15} />
            Generate AI Explanation
          </>
        )}
      </button>

      {/* Loading dots */}
      {loading && (
        <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
          <div style={{ display: "flex", justifyContent: "center",
                        gap: "6px", marginBottom: "10px" }}>
            {[0,1,2].map((i) => (
              <span key={i} style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#6366F1", display: "inline-block",
                animation: `bounce 0.8s ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
          <p style={{ fontSize: "13px", color: "#94A3B8" }}>
            Gemini AI is generating your explanation...
          </p>
        </div>
      )}

      {/* Result */}
      {explanation && !loading && (
        <div style={{ padding: "16px",
                      background: "linear-gradient(135deg,#EEF2FF,#F0FDFA)",
                      borderRadius: "12px",
                      border: "1px solid #C7D2FE" }}>
          <p style={{ fontSize: "11px", fontWeight: 600,
                      color: "#6366F1", margin: "0 0 10px",
                      textTransform: "uppercase",
                      display: "flex", alignItems: "center", gap: "5px" }}>
            <Sparkles size={12} />
            AI Generated Explanation
          </p>
          <p style={{ fontSize: "14px", color: "#0F172A",
                      lineHeight: 1.7, margin: 0,
                      whiteSpace: "pre-line" }}>
            {explanation}
          </p>
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────
// REUSABLE MODAL WRAPPER
// ─────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, wide }) {
  return (
    <div style={{
      position:       "fixed",
      inset:          0,
      zIndex:         50,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "16px",
      background:     "rgba(15,23,42,0.5)",
      backdropFilter: "blur(4px)",
      overflowY:      "auto",
    }}>
      <div style={{
        background:   "#FFFFFF",
        borderRadius: "20px",
        border:       "1px solid #E2E8F0",
        padding:      "28px",
        width:        "100%",
        maxWidth:     wide ? "540px" : "440px",
        maxHeight:    "90vh",
        overflowY:    "auto",
        boxShadow:    "0 20px 60px rgba(0,0,0,0.15)",
        margin:       "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700,
                         color: "#0F172A", margin: 0 }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: "13px", color: "#94A3B8",
                          margin: "4px 0 0" }}>
                {subtitle}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{
            background:     "#F1F5F9",
            border:         "none",
            borderRadius:   "8px",
            width:          "32px",
            height:         "32px",
            cursor:         "pointer",
            color:          "#64748B",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
          }}>
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{ background: "#FEE2E2", border: "1px solid #FECACA",
                  borderRadius: "10px", padding: "12px 16px",
                  marginBottom: "16px", color: "#DC2626",
                  fontSize: "13px", display: "flex",
                  alignItems: "center", gap: "8px" }}>
      <AlertTriangle size={14} />
      {msg}
    </div>
  );
}

function ModalButtons({ onClose, loading, submitLabel }) {
  return (
    <div style={{ display: "flex", gap: "12px",
                  paddingTop: "8px",
                  borderTop: "1px solid #E2E8F0" }}>
      <button type="button" onClick={onClose}
              style={{ ...c.btnSec, flex: 1,
                       justifyContent: "center" }}>
        Cancel
      </button>
      <button type="submit" disabled={loading}
              style={{ ...c.btn, flex: 1,
                       justifyContent: "center",
                       opacity: loading ? 0.7 : 1 }}>
        {loading ? (
          <>
            <span style={{ width: "14px", height: "14px",
                           border: "2px solid #ffffff40",
                           borderTopColor: "#fff", borderRadius: "50%",
                           animation: "spin 0.8s linear infinite" }} />
            Please wait...
          </>
        ) : submitLabel}
      </button>
    </div>
  );
}