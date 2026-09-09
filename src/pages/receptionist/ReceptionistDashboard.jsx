import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  appointmentAPI, patientAPI,
  doctorAPI, authAPI,
} from "../../api/axios.js";
import {
  Calendar, Users, Clock, CheckCircle2,
  Activity, RefreshCw, Search, X,
  AlertTriangle, UserCheck, Plus,
  Pencil, Loader, Save, Lock,
  Eye, EyeOff, Filter, User,
  Stethoscope, ChevronLeft, ChevronRight,
} from "lucide-react";

// ─── shared style tokens ───
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
    fontSize:      "12px",
    fontWeight:    600,
    color:         "#64748B",
    display:       "block",
    marginBottom:  "6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
};

const STATUS_CFG = {
  pending:    { bg: "#FEF3C7", color: "#B45309", label: "Pending"    },
  confirmed:  { bg: "#DCFCE7", color: "#15803D", label: "Confirmed"  },
  checked_in: { bg: "#EEF2FF", color: "#6366F1", label: "Checked In" },
  completed:  { bg: "#F1F5F9", color: "#475569", label: "Completed"  },
  cancelled:  { bg: "#FEE2E2", color: "#DC2626", label: "Cancelled"  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
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
      whiteSpace:   "nowrap",
    }}>
      {cfg.label}
    </span>
  );
};

const Toast = ({ msg, type = "success" }) => msg ? (
  <div style={{
    position:     "fixed",
    top:          "20px",
    right:        "20px",
    zIndex:       200,
    padding:      "14px 20px",
    borderRadius: "12px",
    background:   type === "error" ? "#FEE2E2" : "#DCFCE7",
    border:       `1px solid ${type === "error" ? "#FECACA" : "#BBF7D0"}`,
    color:        type === "error" ? "#DC2626" : "#15803D",
    fontSize:     "14px",
    fontWeight:   500,
    display:      "flex",
    alignItems:   "center",
    gap:          "8px",
    boxShadow:    "0 4px 20px rgba(0,0,0,0.12)",
    animation:    "slideIn 0.3s ease",
    maxWidth:     "360px",
  }}>
    {type === "error"
      ? <AlertTriangle size={16} />
      : <CheckCircle2 size={16} />}
    {msg}
  </div>
) : null;

const Modal = ({ title, subtitle, onClose, children, wide }) => (
  <div style={{
    position:       "fixed",
    inset:          0,
    zIndex:         100,
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
      maxWidth:     wide ? "600px" : "480px",
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

const ErrorBox = ({ msg }) => msg ? (
  <div style={{
    background:   "#FEE2E2",
    border:       "1px solid #FECACA",
    borderRadius: "10px",
    padding:      "12px 16px",
    marginBottom: "16px",
    color:        "#DC2626",
    fontSize:     "13px",
    display:      "flex",
    alignItems:   "center",
    gap:          "8px",
  }}>
    <AlertTriangle size={14} />
    {msg}
  </div>
) : null;

const StatCard = ({ icon: Icon, label, value, color, bg, onClick }) => (
  <div onClick={onClick} style={{
    ...c.card, padding: "20px",
    cursor:     onClick ? "pointer" : "default",
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
      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
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

const TabBtn = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} style={{
    display:      "flex",
    alignItems:   "center",
    gap:          "8px",
    padding:      "9px 16px",
    borderRadius: "9px",
    border:       "none",
    fontSize:     "13px",
    fontWeight:   active ? 600 : 400,
    cursor:       "pointer",
    transition:   "all 0.2s",
    background:   active ? "#FFFFFF" : "transparent",
    color:        active ? "#0F172A" : "#64748B",
    boxShadow:    active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
    whiteSpace:   "nowrap",
  }}>
    <Icon size={15} />
    {label}
  </button>
);

const ModalButtons = ({ onClose, loading, submitLabel }) => (
  <div style={{ display: "flex", gap: "10px",
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
          <span style={{
            width: "14px", height: "14px",
            border: "2px solid #ffffff40",
            borderTopColor: "#fff",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          Please wait...
        </>
      ) : submitLabel}
    </button>
  </div>
);

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function ReceptionistDashboard() {
  const { user, updateUser } = useAuth();

  const [tab,          setTab]          = useState("dashboard");
  const [appointments, setAppointments] = useState([]);
  const [patients,     setPatients]     = useState([]);
  const [doctors,      setDoctors]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState({ msg: "", type: "success" });
  const [bookModal,    setBookModal]    = useState(false);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    const handler = (e) => setTab(e.detail);
    window.addEventListener("receptionist-tab-change", handler);
    return () =>
      window.removeEventListener("receptionist-tab-change", handler);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // ── Use unified endpoint to get ALL patients ──
      const [apptRes, patRes, docRes] = await Promise.all([
        appointmentAPI.getAll(),
        patientAPI.getUnified(),   // ← unified — shows ALL patients
        doctorAPI.getAll(),
      ]);
      setAppointments(apptRes.data.data || []);
      setPatients(patRes.data.data     || []);
      setDoctors(docRes.data.data      || []);
    } catch (err) {
      console.error("fetchAll error:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  // ── Name helpers — works for both sources ──
  const getPatientName = (patientId) => {
    const id = String(patientId);

    // Check patients state (unified list)
    const p = patients.find(
      (p) => String(p.id) === id ||
             String(p.userId) === id ||
             p.id === `user_${patientId}`
    );
    if (p) return p.name;

    return `Patient #${patientId}`;
  };

  const getDoctorName = (doctorId) => {
    const id = String(doctorId);
    const d  = doctors.find((d) => String(d.id) === id);
    return d
      ? `Dr. ${d.firstName} ${d.lastName}`
      : `Doctor #${doctorId}`;
  };

  const getDoctorSpec = (doctorId) => {
    const id = String(doctorId);
    const d  = doctors.find((d) => String(d.id) === id);
    return d?.specialization || "General Practice";
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const TABS = [
    { key: "dashboard",    label: "Dashboard",    icon: Activity  },
    { key: "appointments", label: "Appointments", icon: Calendar  },
    { key: "patients",     label: "Patients",     icon: Users     },
    { key: "profile",      label: "Profile",      icon: User      },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column",
                    gap: "20px" }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            ...c.card, height: "100px",
            background: "#F1F5F9",
            animation:  "pulse 1.5s infinite",
          }} />
        ))}
        <style>{`
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Toast msg={toast.msg} type={toast.type} />

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
            Welcome, {user?.firstName}!
          </p>
          <p style={{ fontSize: "13px", color: "#64748B",
                      margin: "4px 0 0" }}>
            Receptionist Portal · {user?.email}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {/* ── Book Appointment button ── */}
          <button
            onClick={() => setBookModal(true)}
            style={c.btn}>
            <Plus size={15} />
            Book Appointment
          </button>
          <button onClick={fetchAll} style={c.btnSec}>
            <RefreshCw size={14} />
          </button>
        </div>
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
          <TabBtn key={t.key}
            active={tab === t.key}
            onClick={() => {
              setTab(t.key);
              window.__receptionistTab = t.key;
            }}
            icon={t.icon} label={t.label} />
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === "dashboard" && (
        <DashboardTab
          appointments={appointments}
          patients={patients}
          doctors={doctors}
          getPatientName={getPatientName}
          getDoctorName={getDoctorName}
          onTabChange={setTab}
          onBook={() => setBookModal(true)}
        />
      )}
      {tab === "appointments" && (
        <AppointmentsTab
          appointments={appointments}
          setAppointments={setAppointments}
          patients={patients}
          doctors={doctors}
          getPatientName={getPatientName}
          getDoctorName={getDoctorName}
          getDoctorSpec={getDoctorSpec}
          showToast={showToast}
          onRefresh={fetchAll}
          onBook={() => setBookModal(true)}
        />
      )}
      {tab === "patients" && (
        <PatientsTab
          patients={patients}
          setPatients={setPatients}
          appointments={appointments}
          showToast={showToast}
          onRefresh={fetchAll}
        />
      )}
      {tab === "profile" && (
        <ProfileTab user={user} updateUser={updateUser} />
      )}

      {/* ── Book Appointment modal ── */}
      {bookModal && (
        <BookAppointmentModal
          patients={patients}
          doctors={doctors}
          onClose={() => setBookModal(false)}
          onSaved={(appt) => {
            setAppointments((prev) => [appt, ...prev]);
            setBookModal(false);
            showToast("Appointment booked successfully");
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// BOOK APPOINTMENT MODAL
// ─────────────────────────────────────────────
function BookAppointmentModal({ patients, doctors, onClose, onSaved }) {
  const [form, setForm] = useState({
    patientId: "",
    doctorId:  "",
    date:      "",
    reason:    "",
    symptoms:  "",
    status:    "pending",
  });
  const [slots,         setSlots]         = useState([]);
  const [slotsLoading,  setSlotsLoading]  = useState(false);
  const [selectedSlot,  setSelectedSlot]  = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [selectedDate,  setSelectedDate]  = useState("");

  // ── Fetch available slots when doctor + date selected ──
  useEffect(() => {
    if (form.doctorId && selectedDate) {
      fetchSlots();
    } else {
      setSlots([]);
      setSelectedSlot("");
    }
  }, [form.doctorId, selectedDate]);

  const fetchSlots = async () => {
    setSlotsLoading(true);
    setSelectedSlot("");
    try {
      const res = await appointmentAPI.getSlots(
        form.doctorId, selectedDate
      );
      setSlots(res.data.data || []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) {
      setError("Please select a patient"); return;
    }
    if (!form.doctorId) {
      setError("Please select a doctor"); return;
    }
    if (!selectedDate) {
      setError("Please select a date"); return;
    }
    if (!selectedSlot) {
      setError("Please select a time slot"); return;
    }

    // Build the final datetime
    const finalDateTime = new Date(
      `${selectedDate}T${selectedSlot}:00.000Z`
    );

    if (finalDateTime <= new Date()) {
      setError("Appointment date must be in the future"); return;
    }

    setLoading(true);
    setError("");
    try {
      // patientId from unified list — use userId if source is "user"
      const selectedPatient = patients.find(
        (p) => String(p.id) === String(form.patientId)
      );
      const actualPatientId = selectedPatient?.userId ||
        form.patientId;

      const res = await appointmentAPI.create({
        patientId: actualPatientId,
        doctorId:  form.doctorId,
        date:      finalDateTime.toISOString(),
        reason:    form.reason.trim(),
        symptoms:  form.symptoms.trim(),
        status:    "pending",
      });
      onSaved(res.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Booking failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Min date = today ──
  const today = new Date().toISOString().split("T")[0];

  // ── Is weekend ──
  const isWeekend = (dateStr) => {
    const d = new Date(dateStr);
    return d.getDay() === 0 || d.getDay() === 6;
  };

  return (
    <Modal
      title="Book Appointment"
      subtitle="Schedule a new appointment"
      onClose={onClose}
      wide
    >
      <ErrorBox msg={error} />
      <form onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column",
                     gap: "16px" }}>

        {/* Patient */}
        <div>
          <label style={c.label}>
            Patient <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <User size={15} style={{
              position:  "absolute",
              left:      "14px",
              top:       "50%",
              transform: "translateY(-50%)",
              color:     "#94A3B8",
            }} />
            <select
              style={{ ...c.input, paddingLeft: "40px",
                       cursor: "pointer" }}
              value={form.patientId}
              onChange={(e) => {
                setForm((p) => ({ ...p, patientId: e.target.value }));
                setError("");
              }}>
              <option value="">Select patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.source === "user" ? " (App User)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor */}
        <div>
          <label style={c.label}>
            Doctor <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <Stethoscope size={15} style={{
              position:  "absolute",
              left:      "14px",
              top:       "50%",
              transform: "translateY(-50%)",
              color:     "#94A3B8",
            }} />
            <select
              style={{ ...c.input, paddingLeft: "40px",
                       cursor: "pointer" }}
              value={form.doctorId}
              onChange={(e) => {
                setForm((p) => ({ ...p, doctorId: e.target.value }));
                setSelectedDate("");
                setSelectedSlot("");
                setSlots([]);
                setError("");
              }}>
              <option value="">Select doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.firstName} {d.lastName}
                  {d.specialization ? ` — ${d.specialization}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label style={c.label}>
            Date <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            type="date"
            style={{ ...c.input, colorScheme: "light" }}
            min={today}
            value={selectedDate}
            onChange={(e) => {
              const val = e.target.value;
              if (isWeekend(val)) {
                setError("Weekends are not available");
                setSelectedDate(val);
                setSlots([]);
                setSelectedSlot("");
                return;
              }
              setSelectedDate(val);
              setError("");
              setSelectedSlot("");
            }}
          />
          {selectedDate && isWeekend(selectedDate) && (
            <p style={{ fontSize: "12px", color: "#DC2626",
                        marginTop: "4px" }}>
              Please select a weekday (Mon–Fri)
            </p>
          )}
        </div>

        {/* Time slots */}
        {selectedDate && !isWeekend(selectedDate) && form.doctorId && (
          <div>
            <label style={c.label}>
              Time Slot <span style={{ color: "#EF4444" }}>*</span>
            </label>

            {slotsLoading ? (
              <div style={{ display: "flex", alignItems: "center",
                            gap: "8px", padding: "12px 0",
                            color: "#64748B", fontSize: "13px" }}>
                <span style={{
                  width: "16px", height: "16px",
                  border: "2px solid #E2E8F0",
                  borderTopColor: "#0F766E",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                }} />
                Loading available slots...
              </div>
            ) : slots.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#94A3B8",
                          padding: "8px 0" }}>
                No slots available for this date
              </p>
            ) : (
              <>
                {/* Morning */}
                {slots.some((s) => parseInt(s.time) < 13) && (
                  <div style={{ marginBottom: "12px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600,
                                color: "#64748B", textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                margin: "0 0 8px" }}>
                      Morning
                    </p>
                    <div style={{ display: "grid",
                                  gridTemplateColumns:
                                    "repeat(auto-fill,minmax(90px,1fr))",
                                  gap: "8px" }}>
                      {slots
                        .filter((s) => parseInt(s.time) < 13)
                        .map((slot) => {
                          const isSel = selectedSlot === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => {
                                setSelectedSlot(slot.time);
                                setError("");
                              }}
                              style={{
                                padding:      "9px 6px",
                                borderRadius: "10px",
                                fontSize:     "12px",
                                fontWeight:   isSel ? 600 : 400,
                                cursor:       slot.available
                                  ? "pointer" : "not-allowed",
                                border:       isSel
                                  ? "2px solid #0F766E"
                                  : "1px solid #E2E8F0",
                                background:   isSel
                                  ? "#F0FDFA"
                                  : slot.available
                                  ? "#FFFFFF" : "#F8FAFC",
                                color:        isSel
                                  ? "#0F766E"
                                  : slot.available
                                  ? "#0F172A" : "#CBD5E1",
                                opacity:      slot.available ? 1 : 0.5,
                              }}>
                              {slot.label}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Afternoon */}
                {slots.some((s) => parseInt(s.time) >= 13) && (
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 600,
                                color: "#64748B", textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                margin: "0 0 8px" }}>
                      Afternoon
                    </p>
                    <div style={{ display: "grid",
                                  gridTemplateColumns:
                                    "repeat(auto-fill,minmax(90px,1fr))",
                                  gap: "8px" }}>
                      {slots
                        .filter((s) => parseInt(s.time) >= 13)
                        .map((slot) => {
                          const isSel = selectedSlot === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => {
                                setSelectedSlot(slot.time);
                                setError("");
                              }}
                              style={{
                                padding:      "9px 6px",
                                borderRadius: "10px",
                                fontSize:     "12px",
                                fontWeight:   isSel ? 600 : 400,
                                cursor:       slot.available
                                  ? "pointer" : "not-allowed",
                                border:       isSel
                                  ? "2px solid #0F766E"
                                  : "1px solid #E2E8F0",
                                background:   isSel
                                  ? "#F0FDFA"
                                  : slot.available
                                  ? "#FFFFFF" : "#F8FAFC",
                                color:        isSel
                                  ? "#0F766E"
                                  : slot.available
                                  ? "#0F172A" : "#CBD5E1",
                                opacity:      slot.available ? 1 : 0.5,
                              }}>
                              {slot.label}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Reason */}
        <div>
          <label style={c.label}>Reason for Visit</label>
          <input
            style={c.input}
            placeholder="e.g. Regular checkup, Follow-up..."
            value={form.reason}
            onChange={(e) => setForm((p) =>
              ({ ...p, reason: e.target.value }))}
          />
        </div>

        {/* Symptoms */}
        <div>
          <label style={c.label}>Symptoms (optional)</label>
          <textarea
            style={{ ...c.input, height: "80px", resize: "none" }}
            placeholder="Patient-described symptoms..."
            value={form.symptoms}
            onChange={(e) => setForm((p) =>
              ({ ...p, symptoms: e.target.value }))}
          />
        </div>

        {/* Status */}
        <div>
          <label style={c.label}>Initial Status</label>
          <select style={{ ...c.input, cursor: "pointer" }}
            value={form.status}
            onChange={(e) => setForm((p) =>
              ({ ...p, status: e.target.value }))}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>

        <ModalButtons
          onClose={onClose}
          loading={loading}
          submitLabel="Book Appointment"
        />
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD TAB
// ─────────────────────────────────────────────
function DashboardTab({
  appointments, patients, doctors,
  getPatientName, getDoctorName, onTabChange, onBook,
}) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayAppts  = appointments.filter((a) => {
    const d = new Date(a.date);
    return d >= todayStart && d <= todayEnd;
  });

  const pending    = appointments.filter((a) => a.status === "pending");
  const confirmed  = appointments.filter((a) => a.status === "confirmed");
  const checkedIn  = appointments.filter((a) => a.status === "checked_in");

  const upcoming   = appointments
    .filter((a) =>
      (a.status === "pending" || a.status === "confirmed") &&
      new Date(a.date) >= todayStart
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const WORKFLOW = [
    { label: "Pending",    value: pending.length,   color: "#B45309", bg: "#FEF3C7" },
    { label: "Confirmed",  value: confirmed.length,  color: "#0F766E", bg: "#F0FDFA" },
    { label: "Checked In", value: checkedIn.length,  color: "#6366F1", bg: "#EEF2FF" },
    { label: "Completed",
      value: appointments.filter(a=>a.status==="completed").length,
      color: "#15803D", bg: "#DCFCE7" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Stat cards */}
      <div style={{ display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(150px,1fr))",
                    gap: "14px" }}>
        <StatCard icon={Calendar}     label="Today's Appointments"
          value={todayAppts.length}    color="#0F766E" bg="#F0FDFA"
          onClick={() => onTabChange("appointments")} />
        <StatCard icon={Clock}        label="Pending"
          value={pending.length}       color="#B45309" bg="#FEF3C7"
          onClick={() => onTabChange("appointments")} />
        <StatCard icon={UserCheck}    label="Checked In"
          value={checkedIn.length}     color="#6366F1" bg="#EEF2FF"
          onClick={() => onTabChange("appointments")} />
        <StatCard icon={CheckCircle2} label="Completed Today"
          value={todayAppts.filter(a=>a.status==="completed").length}
          color="#15803D" bg="#DCFCE7"
          onClick={() => onTabChange("appointments")} />
        <StatCard icon={Users}        label="Total Patients"
          value={patients.length}      color="#A855F7" bg="#FAF5FF"
          onClick={() => onTabChange("patients")} />
        <StatCard icon={Stethoscope}  label="Doctors"
          value={doctors.length}       color="#0F766E" bg="#F0FDFA" />
      </div>

      {/* Workflow */}
      <div style={c.card}>
        <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600,
                       color: "#0F172A", margin: 0 }}>
            Appointment Workflow
          </h3>
          <button onClick={onBook} style={{ ...c.btn,
                                            padding: "8px 16px",
                                            fontSize: "13px" }}>
            <Plus size={14} />
            Book Appointment
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center",
                      overflowX: "auto" }}>
          {WORKFLOW.map((step, i) => (
            <div key={step.label}
                 style={{ display: "flex", alignItems: "center",
                          flex: 1 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{
                  width:          "52px", height: "52px",
                  borderRadius:   "16px", background: step.bg,
                  display:        "flex", alignItems: "center",
                  justifyContent: "center", margin: "0 auto 8px",
                  fontSize:       "20px", fontWeight: 700,
                  color:          step.color,
                }}>
                  {step.value}
                </div>
                <p style={{ fontSize: "12px", fontWeight: 600,
                            color: step.color, margin: 0 }}>
                  {step.label}
                </p>
              </div>
              {i < WORKFLOW.length - 1 && (
                <div style={{ fontSize: "18px", color: "#CBD5E1",
                              flexShrink: 0, padding: "0 4px",
                              marginBottom: "20px" }}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px" }}>

        {/* Upcoming */}
        <div style={c.card}>
          <div style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600,
                         color: "#0F172A", margin: 0 }}>
              Upcoming
            </h3>
            <button onClick={() => onTabChange("appointments")}
                    style={{ ...c.btnSec, padding: "6px 12px",
                             fontSize: "12px" }}>
              View all
            </button>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Calendar size={28} color="#CBD5E1"
                        style={{ marginBottom: "8px" }} />
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
                No upcoming appointments
              </p>
              <button onClick={onBook}
                      style={{ ...c.btn, marginTop: "12px",
                               display: "inline-flex",
                               padding: "8px 16px",
                               fontSize: "13px" }}>
                Book one now
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column",
                          gap: "8px" }}>
              {upcoming.slice(0, 5).map((appt) => (
                <div key={appt.id} style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  padding:        "10px 12px",
                  background:     "#F8FAFC",
                  borderRadius:   "10px",
                  border:         "1px solid #E2E8F0",
                  gap:            "8px",
                }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500,
                                color: "#0F172A", margin: 0,
                                whiteSpace: "nowrap", overflow: "hidden",
                                textOverflow: "ellipsis" }}>
                      {getPatientName(appt.patientId)}
                    </p>
                    <p style={{ fontSize: "11px", color: "#94A3B8",
                                margin: "2px 0 0" }}>
                      {getDoctorName(appt.doctorId)} ·{" "}
                      {new Date(appt.date).toLocaleTimeString("en-PK", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Needs attention */}
        <div style={c.card}>
          <div style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600,
                         color: "#0F172A", margin: 0 }}>
              Needs Attention
            </h3>
            <span style={{
              padding:      "3px 10px",
              borderRadius: "20px",
              fontSize:     "12px",
              fontWeight:   600,
              background:   "#FEF3C7",
              color:        "#B45309",
            }}>
              {pending.length} pending
            </span>
          </div>
          {pending.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle2 size={28} color="#22C55E"
                            style={{ marginBottom: "8px" }} />
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
                All caught up!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column",
                          gap: "8px" }}>
              {pending.slice(0, 5).map((appt) => (
                <div key={appt.id} style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  padding:        "10px 12px",
                  background:     "#FFFBEB",
                  borderRadius:   "10px",
                  border:         "1px solid #FDE68A",
                  gap:            "8px",
                }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500,
                                color: "#0F172A", margin: 0,
                                whiteSpace: "nowrap", overflow: "hidden",
                                textOverflow: "ellipsis" }}>
                      {getPatientName(appt.patientId)}
                    </p>
                    <p style={{ fontSize: "11px", color: "#94A3B8",
                                margin: "2px 0 0" }}>
                      {new Date(appt.date).toLocaleDateString("en-PK", {
                        month: "short", day: "numeric",
                      })} ·{" "}
                      {new Date(appt.date).toLocaleTimeString("en-PK", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span style={{ fontSize: "11px", color: "#B45309",
                                 fontWeight: 600, whiteSpace: "nowrap" }}>
                    Confirm needed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APPOINTMENTS TAB
// ─────────────────────────────────────────────
function AppointmentsTab({
  appointments, setAppointments,
  patients, doctors,
  getPatientName, getDoctorName, getDoctorSpec,
  showToast, onRefresh, onBook,
}) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [dateFilter,   setDateFilter]   = useState("");
  const [reschedModal, setReschedModal] = useState(null);
  const [detailModal,  setDetailModal]  = useState(null);
  const [loading,      setLoading]      = useState({});
  const [showFilters,  setShowFilters]  = useState(false);

  const filtered = appointments.filter((a) => {
    const patName     = getPatientName(a.patientId).toLowerCase();
    const docName     = getDoctorName(a.doctorId).toLowerCase();
    const q           = search.toLowerCase();
    const matchSearch = !search ||
      patName.includes(q) || docName.includes(q);
    const matchStatus = statusFilter === "all" ||
      a.status === statusFilter;
    const matchDoctor = doctorFilter === "all" ||
      String(a.doctorId) === String(doctorFilter);
    const matchDate   = !dateFilter || (() => {
      const d = new Date(a.date); d.setHours(0,0,0,0);
      const f = new Date(dateFilter); f.setHours(0,0,0,0);
      return d.getTime() === f.getTime();
    })();
    return matchSearch && matchStatus && matchDoctor && matchDate;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const counts = {
    all:        appointments.length,
    pending:    appointments.filter(a=>a.status==="pending").length,
    confirmed:  appointments.filter(a=>a.status==="confirmed").length,
    checked_in: appointments.filter(a=>a.status==="checked_in").length,
    completed:  appointments.filter(a=>a.status==="completed").length,
    cancelled:  appointments.filter(a=>a.status==="cancelled").length,
  };

  const handleStatus = async (id, status) => {
    setLoading((p) => ({ ...p, [id]: status }));
    try {
      await appointmentAPI.update(id, { status });
      setAppointments((prev) =>
        prev.map((a) => a.id === id ? { ...a, status } : a)
      );
      const labels = {
        confirmed:  "Appointment confirmed ✓",
        checked_in: "Patient checked in ✓",
        completed:  "Appointment completed ✓",
        cancelled:  "Appointment cancelled",
      };
      showToast(labels[status] || "Status updated");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Update failed", "error"
      );
    } finally {
      setLoading((p) => ({ ...p, [id]: null }));
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDoctorFilter("all");
    setDateFilter("");
  };

  const hasFilters = search || statusFilter !== "all" ||
    doctorFilter !== "all" || dateFilter;

  const STATUS_FILTERS = [
    { key: "all",        label: "All"        },
    { key: "pending",    label: "Pending"    },
    { key: "confirmed",  label: "Confirmed"  },
    { key: "checked_in", label: "Checked In" },
    { key: "completed",  label: "Completed"  },
    { key: "cancelled",  label: "Cancelled"  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700,
                       color: "#0F172A", margin: 0 }}>
            Appointment Management
          </h2>
          <p style={{ fontSize: "13px", color: "#94A3B8",
                      margin: "4px 0 0" }}>
            {filtered.length} of {appointments.length} appointments
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {hasFilters && (
            <button onClick={clearFilters}
                    style={{ ...c.btnSec, fontSize: "12px",
                             padding: "8px 14px" }}>
              <X size={13} />
              Clear
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              ...c.btnSec,
              background: showFilters ? "#F0FDFA" : "#FFFFFF",
              borderColor: showFilters ? "#0F766E" : "#E2E8F0",
              color:       showFilters ? "#0F766E" : "#475569",
            }}>
            <Filter size={14} />
            Filters
          </button>
          {/* ── Book Appointment button in Appointments tab ── */}
          <button onClick={onBook} style={c.btn}>
            <Plus size={15} />
            Book Appointment
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ ...c.card, padding: "14px 16px" }}>
        <div style={{ position: "relative" }}>
          <Search size={15} style={{
            position: "absolute", left: "14px",
            top: "50%", transform: "translateY(-50%)",
            color: "#94A3B8",
          }} />
          <input
            style={{ ...c.input, paddingLeft: "42px",
                     paddingRight: search ? "40px" : "14px" }}
            placeholder="Search by patient or doctor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position:   "absolute",
              right:      "14px",
              top:        "50%",
              transform:  "translateY(-50%)",
              background: "none",
              border:     "none",
              cursor:     "pointer",
              color:      "#94A3B8",
            }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div style={{ ...c.card, padding: "16px 20px" }}>
          <div style={{ display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit,minmax(180px,1fr))",
                        gap: "14px" }}>
            <div>
              <label style={c.label}>Doctor</label>
              <select style={{ ...c.input, cursor: "pointer" }}
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}>
                <option value="all">All Doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.firstName} {d.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={c.label}>Date</label>
              <input type="date"
                style={{ ...c.input, colorScheme: "light", cursor: "pointer" }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Status pills */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {STATUS_FILTERS.map((f) => {
          const cfg      = STATUS_CFG[f.key];
          const isActive = statusFilter === f.key;
          return (
            <button key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    style={{
                      padding:      "7px 14px",
                      borderRadius: "20px",
                      fontSize:     "13px",
                      fontWeight:   isActive ? 600 : 400,
                      cursor:       "pointer",
                      border:       isActive
                        ? `2px solid ${cfg?.color || "#0F766E"}`
                        : "1px solid #E2E8F0",
                      background:   isActive
                        ? (cfg?.bg || "#F0FDFA") : "#FFFFFF",
                      color:        isActive
                        ? (cfg?.color || "#0F766E") : "#64748B",
                    }}>
              {f.label}
              <span style={{ marginLeft: "6px", fontSize: "11px",
                             opacity: 0.8 }}>
                ({counts[f.key]})
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ ...c.card, textAlign: "center", padding: "60px" }}>
          <Calendar size={36} color="#CBD5E1"
                    style={{ marginBottom: "12px" }} />
          <p style={{ color: "#475569", fontSize: "15px",
                      fontWeight: 500, margin: 0 }}>
            No appointments found
          </p>
          {hasFilters ? (
            <button onClick={clearFilters}
                    style={{ ...c.btnSec, marginTop: "14px",
                             display: "inline-flex" }}>
              Clear filters
            </button>
          ) : (
            <button onClick={onBook}
                    style={{ ...c.btn, marginTop: "14px",
                             display: "inline-flex" }}>
              <Plus size={15} />
              Book First Appointment
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column",
                      gap: "12px" }}>
          {filtered.map((appt) => {
            const apptDate  = new Date(appt.date);
            const isLoading = loading[appt.id];
            const patName   = getPatientName(appt.patientId);
            const docName   = getDoctorName(appt.doctorId);
            const docSpec   = getDoctorSpec(appt.doctorId);

            return (
              <div key={appt.id} style={{
                ...c.card, padding: "16px 20px",
              }}>
                <div style={{ display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              flexWrap: "wrap", gap: "12px" }}>

                  {/* Left */}
                  <div style={{ display: "flex",
                                alignItems: "center",
                                gap: "14px", flex: 1, minWidth: 0 }}>
                    <div style={{
                      width:          "52px", height: "52px",
                      borderRadius:   "14px", background: "#F0FDFA",
                      display:        "flex", alignItems: "center",
                      justifyContent: "center", flexDirection: "column",
                      flexShrink:     0,
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex",
                                    alignItems: "center",
                                    gap: "8px", flexWrap: "wrap" }}>
                        <p style={{ fontSize: "15px", fontWeight: 600,
                                    color: "#0F172A", margin: 0 }}>
                          {patName}
                        </p>
                        <StatusBadge status={appt.status} />
                      </div>
                      <p style={{ fontSize: "12px", color: "#64748B",
                                  margin: "4px 0 0" }}>
                        {docName} · {docSpec}
                      </p>
                      <p style={{ fontSize: "12px", color: "#94A3B8",
                                  margin: "3px 0 0" }}>
                        {apptDate.toLocaleDateString("en-PK", {
                          weekday: "short", month: "short",
                          day: "numeric", year: "numeric",
                        })} at{" "}
                        {apptDate.toLocaleTimeString("en-PK", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      {appt.reason && (
                        <p style={{ fontSize: "12px", color: "#94A3B8",
                                    margin: "2px 0 0",
                                    fontStyle: "italic" }}>
                          Reason: {appt.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right — actions */}
                  <div style={{ display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                alignItems: "flex-end",
                                flexShrink: 0 }}>
                    <button
                      onClick={() => setDetailModal(appt)}
                      style={{ ...c.btnSec, padding: "6px 12px",
                               fontSize: "12px" }}>
                      <Eye size={13} />
                      Details
                    </button>

                    <div style={{ display: "flex", gap: "6px",
                                  flexWrap: "wrap",
                                  justifyContent: "flex-end" }}>
                      {appt.status === "pending" && (
                        <ActionBtn label="Confirm" color="#15803D"
                          bg="#DCFCE7"
                          loading={isLoading === "confirmed"}
                          onClick={() =>
                            handleStatus(appt.id, "confirmed")} />
                      )}
                      {appt.status === "confirmed" && (
                        <ActionBtn label="Check In" color="#6366F1"
                          bg="#EEF2FF"
                          loading={isLoading === "checked_in"}
                          onClick={() =>
                            handleStatus(appt.id, "checked_in")} />
                      )}
                      {appt.status === "checked_in" && (
                        <ActionBtn label="Complete" color="#0F766E"
                          bg="#F0FDFA"
                          loading={isLoading === "completed"}
                          onClick={() =>
                            handleStatus(appt.id, "completed")} />
                      )}
                      {(appt.status === "pending" ||
                        appt.status === "confirmed") && (
                        <>
                          <ActionBtn label="Reschedule" color="#475569"
                            bg="#F1F5F9" border="1px solid #E2E8F0"
                            onClick={() => setReschedModal(appt)} />
                          <ActionBtn label="Cancel" color="#DC2626"
                            bg="#FEE2E2"
                            loading={isLoading === "cancelled"}
                            onClick={() =>
                              handleStatus(appt.id, "cancelled")} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {reschedModal && (
        <RescheduleModal
          appointment={reschedModal}
          getPatientName={getPatientName}
          getDoctorName={getDoctorName}
          onClose={() => setReschedModal(null)}
          onSaved={(updated) => {
            setAppointments((prev) =>
              prev.map((a) =>
                a.id === updated.id ? updated : a
              )
            );
            setReschedModal(null);
            showToast("Appointment rescheduled");
          }}
        />
      )}

      {detailModal && (
        <AppointmentDetailModal
          appointment={detailModal}
          getPatientName={getPatientName}
          getDoctorName={getDoctorName}
          getDoctorSpec={getDoctorSpec}
          onClose={() => setDetailModal(null)}
          onStatusChange={(id, status) => {
            handleStatus(id, status);
            setDetailModal(null);
          }}
        />
      )}
    </div>
  );
}

function ActionBtn({ label, color, bg, border, loading, onClick }) {
  return (
    <button disabled={!!loading} onClick={onClick} style={{
      padding:      "6px 12px",
      borderRadius: "8px",
      border:       border || "none",
      fontSize:     "12px",
      fontWeight:   500,
      cursor:       loading ? "not-allowed" : "pointer",
      background:   bg,
      color:        color,
      opacity:      loading ? 0.7 : 1,
      display:      "inline-flex",
      alignItems:   "center",
      gap:          "4px",
      whiteSpace:   "nowrap",
    }}>
      {loading && (
        <span style={{
          width: "10px", height: "10px",
          border: `2px solid ${color}40`,
          borderTopColor: color,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          display: "inline-block",
        }} />
      )}
      {label}
    </button>
  );
}

function AppointmentDetailModal({
  appointment, getPatientName, getDoctorName, getDoctorSpec,
  onClose, onStatusChange,
}) {
  const apptDate = new Date(appointment.date);
  const ROWS = [
    { label: "Patient",        value: getPatientName(appointment.patientId) },
    { label: "Doctor",         value: getDoctorName(appointment.doctorId)   },
    { label: "Specialization", value: getDoctorSpec(appointment.doctorId)   },
    { label: "Date",           value: apptDate.toLocaleDateString("en-PK",{
        weekday:"long",day:"numeric",month:"long",year:"numeric"}) },
    { label: "Time",           value: apptDate.toLocaleTimeString("en-PK",{
        hour:"2-digit",minute:"2-digit"}) },
    { label: "Status",         value: <StatusBadge status={appointment.status} /> },
    { label: "Appt #",         value: `#${appointment.id}` },
  ];
  if (appointment.reason)
    ROWS.push({ label: "Reason",   value: appointment.reason   });
  if (appointment.symptoms)
    ROWS.push({ label: "Symptoms", value: appointment.symptoms });

  return (
    <Modal title="Appointment Details"
           subtitle={`#${appointment.id}`}
           onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column",
                    gap: "0", marginBottom: "20px" }}>
        {ROWS.map((row) => (
          <div key={row.label} style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "flex-start",
            padding:        "10px 0",
            borderBottom:   "1px solid #F1F5F9",
            gap:            "12px",
          }}>
            <span style={{ fontSize: "13px", color: "#94A3B8",
                           flexShrink: 0, minWidth: "110px" }}>
              {row.label}
            </span>
            <span style={{ fontSize: "13px", fontWeight: 500,
                           color: "#0F172A", textAlign: "right" }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {appointment.status === "pending" && (
          <>
            <button
              onClick={() =>
                onStatusChange(appointment.id, "confirmed")
              }
              style={{ ...c.btn, flex: 1,
                       justifyContent: "center", padding: "9px" }}>
              ✓ Confirm
            </button>
            <button
              onClick={() =>
                onStatusChange(appointment.id, "cancelled")
              }
              style={{ ...c.btnSec, color: "#DC2626",
                       border: "1px solid #FECACA",
                       background: "#FEE2E2", padding: "9px 14px" }}>
              Cancel
            </button>
          </>
        )}
        {appointment.status === "confirmed" && (
          <button
            onClick={() =>
              onStatusChange(appointment.id, "checked_in")
            }
            style={{ ...c.btn, flex: 1,
                     justifyContent: "center", padding: "9px",
                     background:
                       "linear-gradient(135deg,#6366F1,#A855F7)" }}>
            Check In Patient
          </button>
        )}
        {appointment.status === "checked_in" && (
          <button
            onClick={() =>
              onStatusChange(appointment.id, "completed")
            }
            style={{ ...c.btn, flex: 1,
                     justifyContent: "center", padding: "9px" }}>
            Mark Completed
          </button>
        )}
      </div>
    </Modal>
  );
}

function RescheduleModal({
  appointment, getPatientName, getDoctorName, onClose, onSaved,
}) {
  const [date,    setDate]    = useState(
    appointment.date
      ? new Date(appointment.date).toISOString().slice(0, 16) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) { setError("Please select a new date"); return; }
    if (new Date(date) <= new Date()) {
      setError("New date must be in the future"); return;
    }
    setLoading(true);
    try {
      const res = await appointmentAPI.update(
        appointment.id,
        { date: new Date(date).toISOString() }
      );
      onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Reschedule failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Reschedule Appointment"
      subtitle={`${getPatientName(appointment.patientId)} → ${getDoctorName(appointment.doctorId)}`}
      onClose={onClose}
    >
      <ErrorBox msg={error} />
      <form onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column",
                     gap: "14px" }}>
        <div>
          <label style={c.label}>Current Schedule</label>
          <div style={{ padding: "10px 14px", background: "#F8FAFC",
                        borderRadius: "10px", border: "1px solid #E2E8F0",
                        fontSize: "13px", color: "#475569" }}>
            {new Date(appointment.date).toLocaleDateString("en-PK",{
              weekday:"long",month:"long",day:"numeric",year:"numeric",
            })} at{" "}
            {new Date(appointment.date).toLocaleTimeString("en-PK",{
              hour:"2-digit",minute:"2-digit",
            })}
          </div>
        </div>
        <div>
          <label style={c.label}>
            New Date & Time <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input type="datetime-local"
            style={{ ...c.input, colorScheme: "light" }}
            value={date}
            onChange={(e) => { setDate(e.target.value); setError(""); }} />
        </div>
        <ModalButtons onClose={onClose} loading={loading}
                      submitLabel="Reschedule" />
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// PATIENTS TAB
// ─────────────────────────────────────────────
function PatientsTab({
  patients, setPatients, appointments, showToast, onRefresh,
}) {
  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData,  setEditData]  = useState(null);
  const [viewModal, setViewModal] = useState(null);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.contact?.includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  const getApptCount = (patient) => {
    // Match using userId (for app users) or id (for manual)
    const targetId = patient.userId || patient.id;
    return appointments.filter(
      (a) => String(a.patientId) === String(targetId)
    ).length;
  };

  const getLastVisit = (patient) => {
    const targetId = patient.userId || patient.id;
    const appts    = appointments
      .filter(
        (a) =>
          String(a.patientId) === String(targetId) &&
          a.status === "completed"
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return appts[0]
      ? new Date(appts[0].date).toLocaleDateString("en-PK", {
          month: "short", day: "numeric", year: "numeric",
        })
      : "No visits";
  };

  // ── After save: update local state correctly ──
  const handleSaved = (updatedPatient, isEdit) => {
    if (isEdit) {
      setPatients((prev) =>
        prev.map((p) => {
          // Match by Patient record id
          if (updatedPatient.id && p.id === updatedPatient.id)
            return { ...updatedPatient };
          // Match by userId (for user_no_record entries)
          if (
            updatedPatient.userId &&
            p.userId === updatedPatient.userId
          )
            return { ...updatedPatient };
          return p;
        })
      );
      showToast("Patient updated successfully");
    } else {
      setPatients((prev) => [
        { ...updatedPatient, source: "patient" },
        ...prev,
      ]);
      showToast("Patient registered successfully");
    }
    setShowModal(false);
    setEditData(null);
  };

  const initials = (name) => {
    if (!name) return "P";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  const AVATAR_COLORS = [
    { bg: "#CCFBF1", color: "#0F766E" },
    { bg: "#EEF2FF", color: "#6366F1" },
    { bg: "#FAF5FF", color: "#A855F7" },
    { bg: "#FEF3C7", color: "#B45309" },
    { bg: "#FEE2E2", color: "#DC2626" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700,
                       color: "#0F172A", margin: 0 }}>
            All Patients
          </h2>
          <p style={{ fontSize: "13px", color: "#94A3B8",
                      margin: "4px 0 0" }}>
            {filtered.length} patient{filtered.length !== 1 ? "s" : ""} ·{" "}
            {patients.filter(p => p.source === "user" || p.source === "user_no_record").length} app users ·{" "}
            {patients.filter(p => p.source === "patient").length} manually registered
          </p>
        </div>
        <button
          onClick={() => { setEditData(null); setShowModal(true); }}
          style={c.btn}>
          <Plus size={15} />
          Register Patient
        </button>
      </div>

      {/* Search */}
      <div style={{ ...c.card, padding: "14px 16px" }}>
        <div style={{ position: "relative" }}>
          <Search size={15} style={{
            position: "absolute", left: "14px",
            top: "50%", transform: "translateY(-50%)",
            color: "#94A3B8",
          }} />
          <input
            style={{ ...c.input, paddingLeft: "42px" }}
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position: "absolute", right: "14px",
              top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none",
              cursor: "pointer", color: "#94A3B8",
            }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ ...c.card, textAlign: "center", padding: "60px" }}>
          <Users size={36} color="#CBD5E1"
                 style={{ marginBottom: "12px" }} />
          <p style={{ color: "#475569", fontSize: "15px",
                      fontWeight: 500, margin: 0 }}>
            No patients found
          </p>
        </div>
      ) : (
        <div style={{ ...c.card, padding: 0, overflow: "hidden" }}>
          {/* Header row */}
          <div style={{
            display:             "grid",
            gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr",
            padding:             "12px 20px",
            background:          "#F8FAFC",
            borderBottom:        "1px solid #E2E8F0",
          }}>
            {["Patient","Source","Age","Gender",
              "Blood","Last Visit","Actions"].map((h) => (
              <p key={h} style={{ fontSize: "11px", fontWeight: 600,
                                  color: "#94A3B8",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  margin: 0 }}>
                {h}
              </p>
            ))}
          </div>

          {filtered.map((patient, i) => {
            const av         = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const isAppUser  = patient.source === "user" ||
                               patient.source === "user_no_record";

            return (
              <div key={patient.id || patient.userId || i} style={{
                display:             "grid",
                gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr",
                padding:             "14px 20px",
                borderBottom:        "1px solid #F1F5F9",
                alignItems:          "center",
                transition:          "background 0.1s",
              }}
                onMouseEnter={(e) =>
                  e.currentTarget.style.background = "#F8FAFC"
                }
                onMouseLeave={(e) =>
                  e.currentTarget.style.background = "transparent"
                }>

                {/* Name */}
                <div style={{ display: "flex", alignItems: "center",
                              gap: "10px" }}>
                  <div style={{
                    width: "34px", height: "34px",
                    borderRadius: "50%", background: av.bg,
                    display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "12px",
                    fontWeight: 700, color: av.color, flexShrink: 0,
                  }}>
                    {initials(patient.name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500,
                                color: "#0F172A", margin: 0,
                                whiteSpace: "nowrap", overflow: "hidden",
                                textOverflow: "ellipsis" }}>
                      {patient.name}
                    </p>
                    <p style={{ fontSize: "11px", color: "#94A3B8",
                                margin: "1px 0 0" }}>
                      {getApptCount(patient)} visits
                    </p>
                  </div>
                </div>

                {/* Source badge */}
                <span style={{
                  display:      "inline-flex",
                  padding:      "2px 8px",
                  borderRadius: "8px",
                  fontSize:     "11px",
                  fontWeight:   500,
                  background:   isAppUser ? "#EEF2FF" : "#F0FDFA",
                  color:        isAppUser ? "#6366F1" : "#0F766E",
                }}>
                  {isAppUser ? "App User" : "Registered"}
                </span>

                <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
                  {patient.age ? `${patient.age} yrs` : "—"}
                </p>

                <p style={{ fontSize: "13px", color: "#475569",
                            margin: 0, textTransform: "capitalize" }}>
                  {patient.gender || "—"}
                </p>

                <span style={{
                  display: "inline-flex", padding: "2px 8px",
                  borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                  background: patient.bloodGroup ? "#FEE2E2" : "#F1F5F9",
                  color:      patient.bloodGroup ? "#DC2626" : "#94A3B8",
                }}>
                  {patient.bloodGroup || "—"}
                </span>

                <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                  {getLastVisit(patient)}
                </p>

                {/* Actions — ALL patients editable */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => setViewModal(patient)}
                    style={{
                      padding: "5px 10px", borderRadius: "8px",
                      border: "none", fontSize: "11px", fontWeight: 500,
                      cursor: "pointer", background: "#F0FDFA",
                      color: "#0F766E", display: "flex",
                      alignItems: "center", gap: "4px",
                    }}>
                    <Eye size={11} />
                    View
                  </button>
                  {/* ← Edit button available for ALL patients */}
                  <button
                    onClick={() => {
                      setEditData(patient);
                      setShowModal(true);
                    }}
                    style={{
                      padding: "5px 10px", borderRadius: "8px",
                      border: "none", fontSize: "11px", fontWeight: 500,
                      cursor: "pointer", background: "#EEF2FF",
                      color: "#6366F1", display: "flex",
                      alignItems: "center", gap: "4px",
                    }}>
                    <Pencil size={11} />
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <PatientFormModal
          editData={editData}
          onClose={() => { setShowModal(false); setEditData(null); }}
          onSaved={handleSaved}
        />
      )}

      {viewModal && (
        <Modal
          title={viewModal.name}
          subtitle={
            viewModal.source === "user" || viewModal.source === "user_no_record"
              ? "App User Account"
              : `Patient #${viewModal.id}`
          }
          onClose={() => setViewModal(null)}
          wide
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { label: "Name",         value: viewModal.name },
              { label: "Age",          value: viewModal.age ? `${viewModal.age} years` : "—" },
              { label: "Gender",       value: viewModal.gender || "—" },
              { label: "Blood Group",  value: viewModal.bloodGroup || "—" },
              { label: "Contact",      value: viewModal.contact || "—" },
              { label: "Email",        value: viewModal.email || "—" },
              { label: "Address",      value: viewModal.address || "—" },
              { label: "Source",       value:
                viewModal.source === "user" || viewModal.source === "user_no_record"
                  ? "Registered via App"
                  : "Manually Registered" },
              { label: "Total Visits", value: getApptCount(viewModal) },
              { label: "Last Visit",   value: getLastVisit(viewModal) },
            ].map((row) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", padding: "10px 0",
                borderBottom: "1px solid #F1F5F9", gap: "12px",
              }}>
                <span style={{ fontSize: "13px", color: "#94A3B8",
                               flexShrink: 0, minWidth: "100px" }}>
                  {row.label}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 500,
                               color: "#0F172A", textAlign: "right",
                               textTransform: "capitalize" }}>
                  {row.value}
                </span>
              </div>
            ))}
            {viewModal.history && (
              <div style={{ marginTop: "12px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600,
                            color: "#64748B", textTransform: "uppercase",
                            margin: "0 0 8px" }}>
                  Medical History
                </p>
                <p style={{ fontSize: "13px", color: "#475569",
                            lineHeight: 1.6, margin: 0, padding: "12px",
                            background: "#F8FAFC", borderRadius: "10px",
                            border: "1px solid #E2E8F0" }}>
                  {viewModal.history}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// PATIENT FORM MODAL
// ─────────────────────────────────────────────
function PatientFormModal({ editData, onClose, onSaved }) {
  const isEdit = Boolean(editData);

  // Determine what kind of patient this is
  const isAppUser = editData &&
    (editData.source === "user" || editData.source === "user_no_record");

  // For app users: they have a userId
  // For app users WITH a Patient record: editData.id is a real number
  // For app users WITHOUT a Patient record: editData.id is null
  const hasPatientRecord = editData?.id !== null &&
    editData?.id !== undefined &&
    !String(editData?.id || "").startsWith("user_");

  const [form, setForm] = useState({
    name:       editData?.name       || "",
    age:        editData?.age        || "",
    gender:     editData?.gender     || "",
    contact:    editData?.contact    || "",
    email:      editData?.email      || "",
    address:    editData?.address    || "",
    bloodGroup: editData?.bloodGroup || "",
    history:    editData?.history    || "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!form.patientId) { setError("Please select a patient"); return; }
  if (!form.doctorId)  { setError("Please select a doctor");  return; }
  if (!selectedDate)   { setError("Please select a date");    return; }
  if (!selectedSlot)   { setError("Please select a time slot"); return; }

  // ── Build datetime treating slot as PKT (UTC+5) ──
  // selectedDate = "2026-01-15", selectedSlot = "09:00"
  // We want to store 09:00 PKT which is 04:00 UTC
  const [slotH, slotM] = selectedSlot.split(":").map(Number);
  const [year, month, day] = selectedDate.split("-").map(Number);

  // PKT offset = +5 hours = -5 from PKT to UTC
  let utcH = slotH - 5;
  let utcDay = day;
  let utcMonth = month;
  let utcYear = year;

  if (utcH < 0) {
    utcH += 24;
    utcDay -= 1;
    if (utcDay < 1) {
      utcMonth -= 1;
      if (utcMonth < 1) {
        utcMonth = 12;
        utcYear -= 1;
      }
      // Get last day of previous month
      utcDay = new Date(utcYear, utcMonth, 0).getDate();
    }
  }

  const finalDateTime = new Date(Date.UTC(
    utcYear, utcMonth - 1, utcDay, utcH, slotM, 0
  ));

  if (finalDateTime <= new Date()) {
    setError("Appointment date must be in the future"); return;
  }

  setLoading(true);
  setError("");
  try {
    const selectedPatient = patients.find(
      (p) => String(p.id) === String(form.patientId)
    );
    const actualPatientId = selectedPatient?.userId ||
      form.patientId;

    const res = await appointmentAPI.create({
      patientId: actualPatientId,
      doctorId:  form.doctorId,
      date:      finalDateTime.toISOString(),
      reason:    form.reason.trim(),
      symptoms:  form.symptoms.trim(),
      status:    "pending",
    });
    onSaved(res.data.data);
  } catch (err) {
    setError(err.response?.data?.message || "Booking failed");
  } finally {
    setLoading(false);
  }
};

return (
    <Modal
      title={
        isEdit
          ? isAppUser
            ? "Update App User Medical Info"
            : "Edit Patient Record"
          : "Register New Patient"
      }
      subtitle={
        isEdit
          ? isAppUser
            ? `Updating medical info for ${editData?.name}`
            : "Update patient information"
          : "Add a new patient record"
      }
      onClose={onClose}
      wide
    >
      <ErrorBox msg={error} />

      {/* Info banner for app users */}
      {isEdit && isAppUser && (
        <div style={{
          padding:      "12px 16px",
          background:   "#EEF2FF",
          border:       "1px solid #C7D2FE",
          borderRadius: "10px",
          marginBottom: "16px",
          fontSize:     "13px",
          color:        "#4F46E5",
          display:      "flex",
          alignItems:   "flex-start",
          gap:          "8px",
        }}>
          <span style={{ flexShrink: 0 }}>ℹ️</span>
          <span>
            <strong>{editData?.name}</strong> is an app-registered user.
            You can update their medical information below.
            Their login credentials remain unchanged.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column",
                     gap: "14px" }}>

        {/* Name — read-only for app users */}
        <div>
          <label style={c.label}>
            Full Name {!isAppUser && <span style={{ color: "#EF4444" }}>*</span>}
          </label>
          <input
            style={{
              ...c.input,
              opacity: isAppUser ? 0.6 : 1,
              cursor:  isAppUser ? "not-allowed" : "text",
            }}
            placeholder="Muhammad Ali Khan"
            value={form.name}
            disabled={isAppUser}
            onChange={(e) => {
              if (!isAppUser) {
                setForm((p) => ({ ...p, name: e.target.value }));
                setError("");
              }
            }}
          />
          {isAppUser && (
            <p style={{ fontSize: "11px", color: "#94A3B8",
                        marginTop: "4px" }}>
              Name is managed by the patient's account
            </p>
          )}
        </div>

        <div style={{ display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px" }}>
          <div>
            <label style={c.label}>Age</label>
            <input type="number" min="0" max="120" style={c.input}
              placeholder="35" value={form.age}
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
            <label style={c.label}>Contact</label>
            <input style={c.input} placeholder="+92 300 0000000"
              value={form.contact}
              onChange={(e) => setForm((p) =>
                ({ ...p, contact: e.target.value }))} />
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
        </div>

        {/* Email — read-only for app users */}
        {!isAppUser && (
          <div>
            <label style={c.label}>Email</label>
            <input type="email" style={c.input}
              placeholder="patient@email.com"
              value={form.email}
              onChange={(e) => setForm((p) =>
                ({ ...p, email: e.target.value }))} />
          </div>
        )}

        <div>
          <label style={c.label}>Address</label>
          <input style={c.input}
            placeholder="House 12, Street 4, Lahore"
            value={form.address}
            onChange={(e) => setForm((p) =>
              ({ ...p, address: e.target.value }))} />
        </div>

        <div>
          <label style={c.label}>Medical History</label>
          <textarea
            style={{ ...c.input, height: "80px", resize: "none" }}
            placeholder="Previous conditions, allergies..."
            value={form.history}
            onChange={(e) => setForm((p) =>
              ({ ...p, history: e.target.value }))} />
        </div>

        <ModalButtons
          onClose={onClose}
          loading={loading}
          submitLabel={
            isEdit
              ? isAppUser
                ? "Update Medical Info"
                : "Save Changes"
              : "Register Patient"
          }
        />
      </form>
    </Modal>
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
          Profile Settings
        </h2>
        <p style={{ fontSize: "13px", color: "#94A3B8",
                    margin: "4px 0 0" }}>
          Manage your account
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {[
          { key: "info",     label: "Account Info"    },
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
                    color: profileTab === t.key ? "#FFFFFF" : "#64748B",
                  }}>
            {t.label}
          </button>
        ))}
      </div>

      {profileTab === "info" && (
        <ProfileInfoTab user={user} updateUser={updateUser} />
      )}
      {profileTab === "password" && <ChangePasswordTab />}
    </div>
  );
}

function ProfileInfoTab({ user, updateUser }) {
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName:  user?.lastName  || "",
    phone:     user?.phone     || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const initials =
    `${user?.firstName?.[0]??""}${user?.lastName?.[0]??""}`.toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name required"); return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px" }}>
      <div style={{ ...c.card, gridColumn: "1 / -1",
                    display: "flex", alignItems: "center",
                    gap: "20px" }}>
        <div style={{
          width:          "64px", height: "64px",
          borderRadius:   "18px",
          background:     "linear-gradient(135deg,#EEF2FF,#F0FDFA)",
          display:        "flex", alignItems: "center",
          justifyContent: "center", fontSize: "22px",
          fontWeight:     700, color: "#6366F1", flexShrink: 0,
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
            Receptionist · {user?.email}
          </p>
        </div>
      </div>

      <div style={{ ...c.card, gridColumn: "1 / -1" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600,
                     color: "#0F172A", margin: "0 0 20px" }}>
          Update Information
        </h3>

        {success && (
          <div style={{ background: "#DCFCE7",
                        border: "1px solid #BBF7D0",
                        borderRadius: "10px", padding: "12px 16px",
                        marginBottom: "16px", color: "#15803D",
                        fontSize: "13px", display: "flex",
                        alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={14} />
            Profile updated
          </div>
        )}

        <ErrorBox msg={error} />

        <form onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column",
                       gap: "14px" }}>
          <div style={{ display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px" }}>
            <div>
              <label style={c.label}>First Name</label>
              <input style={c.input} value={form.firstName}
                onChange={(e) => setForm((p) =>
                  ({ ...p, firstName: e.target.value }))} />
            </div>
            <div>
              <label style={c.label}>Last Name</label>
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
          <button type="submit" disabled={loading}
                  style={{ ...c.btn, width: "fit-content",
                           padding: "10px 24px",
                           opacity: loading ? 0.7 : 1 }}>
            {loading ? (
              <>
                <span style={{
                  width: "14px", height: "14px",
                  border: "2px solid #ffffff40",
                  borderTopColor: "#fff", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Changes
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
    if (!form.currentPassword) {
      setError("Current password required"); return;
    }
    if (form.newPassword.length < 6) {
      setError("Min 6 characters"); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match"); return;
    }
    setLoading(true);
    setError("");
    try {
      await authAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "",
                confirmPassword: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed");
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
          Password changed
        </div>
      )}

      <ErrorBox msg={error} />

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
                onChange={(e) => {
                  setError("");
                  setForm((p) => ({
                    ...p, [field.name]: e.target.value,
                  }));
                }}
              />
              <button type="button"
                      onClick={() => setShow((p) => ({
                        ...p, [field.name]: !p[field.name],
                      }))}
                      style={{ position: "absolute", right: "14px",
                               top: "50%", transform: "translateY(-50%)",
                               background: "none", border: "none",
                               cursor: "pointer", color: "#94A3B8" }}>
                {show[field.name]
                  ? <EyeOff size={15} />
                  : <Eye size={15} />}
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