import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
    doctorAPI, appointmentAPI, patientAPI,
    prescriptionAPI, aiAPI,
} from "../../api/axios.js";
import {
    Calendar, Users, FileText, Brain,
    CheckCircle2, Clock, Activity, Plus,
    Stethoscope, TrendingUp, RefreshCw,
    ChevronRight, AlertTriangle, X,
    Search, Eye, Pill, Sparkles,
    Download, Loader, Shield, FlaskConical,
    BarChart3, User, Phone, Mail,
    Save, Lock, EyeOff,
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from "recharts";
import { authAPI } from "../../api/axios.js";

// ─── shared style tokens (match Patient Dashboard) ───
const c = {
    card: {
        background: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E2E8F0",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    btn: {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 20px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        border: "none",
        background: "linear-gradient(135deg,#0F766E,#6366F1)",
        color: "#FFFFFF",
    },
    btnSec: {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "9px 16px",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        border: "1px solid #E2E8F0",
        background: "#FFFFFF",
        color: "#475569",
    },
    input: {
        width: "100%",
        padding: "10px 14px",
        border: "1px solid #E2E8F0",
        borderRadius: "10px",
        fontSize: "14px",
        color: "#0F172A",
        background: "#F8FAFC",
        outline: "none",
        boxSizing: "border-box",
    },
    label: {
        fontSize: "12px",
        fontWeight: 600,
        color: "#64748B",
        display: "block",
        marginBottom: "6px",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
    },
};

// ── Status badge ──
const StatusBadge = ({ status }) => {
    const map = {
        confirmed: { bg: "#DCFCE7", color: "#15803D" },
        pending: { bg: "#FEF3C7", color: "#B45309" },
        completed: { bg: "#F1F5F9", color: "#475569" },
        active: { bg: "#DCFCE7", color: "#15803D" },
        cancelled: { bg: "#FEE2E2", color: "#DC2626" },
    };
    const cfg = map[status] || map.pending;
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 500,
            background: cfg.bg,
            color: cfg.color,
        }}>
            {status}
        </span>
    );
};

// ── Stat card ──
const StatCard = ({ icon: Icon, label, value, color, bg, onClick }) => (
    <div onClick={onClick} style={{
        ...c.card, padding: "20px",
        cursor: onClick ? "pointer" : "default",
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
            width: "40px", height: "40px",
            borderRadius: "12px", background: bg,
            display: "flex", alignItems: "center",
            justifyContent: "center", marginBottom: "14px",
        }}>
            <Icon size={18} style={{ color }} />
        </div>
        <p style={{
            fontSize: "26px", fontWeight: 700,
            color: "#0F172A", margin: 0
        }}>
            {value}
        </p>
        <p style={{
            fontSize: "13px", color: "#94A3B8",
            margin: "4px 0 0"
        }}>
            {label}
        </p>
    </div>
);

// ── Tab button ──
const TabBtn = ({ active, onClick, icon: Icon, label }) => (
    <button onClick={onClick} style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "9px 16px",
        borderRadius: "9px",
        border: "none",
        fontSize: "13px",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.2s",
        background: active ? "#FFFFFF" : "transparent",
        color: active ? "#0F172A" : "#64748B",
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
        whiteSpace: "nowrap",
    }}>
        <Icon size={15} />
        {label}
    </button>
);

// ── Modal wrapper ──
const Modal = ({ title, subtitle, onClose, children, wide }) => (
    <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(4px)",
        overflowY: "auto",
    }}>
        <div style={{
            background: "#FFFFFF",
            borderRadius: "20px",
            border: "1px solid #E2E8F0",
            padding: "28px",
            width: "100%",
            maxWidth: wide ? "640px" : "480px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            margin: "auto",
        }}>
            <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: "24px"
            }}>
                <div>
                    <h2 style={{
                        fontSize: "18px", fontWeight: 700,
                        color: "#0F172A", margin: 0
                    }}>
                        {title}
                    </h2>
                    {subtitle && (
                        <p style={{
                            fontSize: "13px", color: "#94A3B8",
                            margin: "4px 0 0"
                        }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <button onClick={onClose} style={{
                    background: "#F1F5F9",
                    border: "none",
                    borderRadius: "8px",
                    width: "32px",
                    height: "32px",
                    cursor: "pointer",
                    color: "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}>
                    <X size={15} />
                </button>
            </div>
            {children}
        </div>
    </div>
);

// ── Error box ──
const ErrorBox = ({ msg }) => msg ? (
    <div style={{
        background: "#FEE2E2", border: "1px solid #FECACA",
        borderRadius: "10px", padding: "12px 16px",
        marginBottom: "16px", color: "#DC2626",
        fontSize: "13px", display: "flex",
        alignItems: "center", gap: "8px",
    }}>
        <AlertTriangle size={14} />
        {msg}
    </div>
) : null;

// ── Success box ──
const SuccessBox = ({ msg }) => msg ? (
    <div style={{
        background: "#DCFCE7", border: "1px solid #BBF7D0",
        borderRadius: "10px", padding: "12px 16px",
        marginBottom: "16px", color: "#15803D",
        fontSize: "13px", display: "flex",
        alignItems: "center", gap: "8px",
    }}>
        <CheckCircle2 size={14} />
        {msg}
    </div>
) : null;

// ── Toast ──
const Toast = ({ msg }) => msg ? (
    <div style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 100,
        padding: "14px 20px",
        borderRadius: "12px",
        background: "#DCFCE7",
        border: "1px solid #BBF7D0",
        color: "#15803D",
        fontSize: "14px",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        animation: "slideIn 0.3s ease",
    }}>
        <CheckCircle2 size={18} />
        {msg}
    </div>
) : null;

// ─────────────────────────────────────────────
// MAIN DOCTOR DASHBOARD
// ─────────────────────────────────────────────
export default function DoctorDashboard() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState("dashboard");
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [diagLogs, setDiagLogs] = useState([]);
    const [doctorStats, setDoctorStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState("");

    useEffect(() => { fetchAll(); }, []);

    // ── Listen for sidebar tab switch ──
    useEffect(() => {
        const handler = (e) => setTab(e.detail);
        window.addEventListener("doctor-tab-change", handler);
        return () =>
            window.removeEventListener("doctor-tab-change", handler);
    }, []);

    // ── Replace the fetchAll function ──
    // ── Replace fetchAll completely ──
    const fetchAll = async () => {
  setLoading(true);
  try {
    const [apptRes, presRes, statsRes, logsRes] = await Promise.all([
      appointmentAPI.getByDoctorDetailed(user.id),
      prescriptionAPI.getByDoctor(user.id),
      doctorAPI.getStats(user.id),
      aiAPI.getLogsByDoctor(user.id).catch(() =>
        aiAPI.getLogs()
      ),
    ]);

    const myAppointments = apptRes.data.data || [];
    setAppointments(myAppointments);

    // ── Build unique patients list from enriched appointments ──
    const seenIds    = new Set();
    const myPatients = [];

    for (const appt of myAppointments) {
      const key = String(appt.patientId);
      if (seenIds.has(key)) continue;
      seenIds.add(key);

      myPatients.push({
        id:     appt.patientId,
        userId: appt.patientId,
        name:   appt.patientName   || `Patient #${appt.patientId}`,
        email:  appt.patientEmail  || "",
        phone:  appt.patientPhone  || "",
        age:    appt.patientAge    || null,
        gender: appt.patientGender || null,
        // Try to get more info from Patient record if available
        patientRecordId: appt.patientRecordId || null,
      });
    }

    setPatients(myPatients);

    const presData = presRes.data.data || [];
    setPrescriptions(presData);

    setDoctorStats(statsRes.data.data || {});

    const logsData = logsRes.data.data || [];
    setDiagLogs(
      Array.isArray(logsData)
        ? logsData.filter(
            (l) => String(l.doctorId) === String(user.id)
          )
        : []
    );

  } catch (err) {
    console.error("DoctorDashboard fetchAll:", err);
  } finally {
    setLoading(false);
  }
};
    // ── Replace getPatientName helper ──
    // appointments now carry patientName directly so this is simple:
    const getPatientName = (patientId) => {
        const appt = appointments.find(
            (a) => String(a.patientId) === String(patientId)
        );
        if (appt?.patientName) return appt.patientName;

        // fallback: check patients state
        const p = patients.find(
            (p) => String(p.id) === String(patientId)
        );
        return p ? p.name : `Patient #${patientId}`;
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    };

    // ── Replace getPatientName helper ──
    // const getPatientName = (patientId) => {
    //     const id = String(patientId);
    //     const p = patients.find((p) => p.id === id || p.id === patientId);
    //     return p ? p.name : `Patient #${patientId}`;
    // };

    const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

    const TABS = [
        { key: "dashboard", label: "Dashboard", icon: Activity },
        { key: "patients", label: "Patients", icon: Users },
        { key: "appointments", label: "Appointments", icon: Calendar },
        { key: "diagnosis", label: "AI Diagnosis", icon: Brain },
        { key: "prescriptions", label: "Prescriptions", icon: FileText },
        { key: "analytics", label: "Analytics", icon: BarChart3 },
        { key: "profile", label: "Profile", icon: User },
    ];

    if (loading) {
        return (
            <div style={{
                display: "flex", flexDirection: "column",
                gap: "20px"
            }}>
                {[...Array(3)].map((_, i) => (
                    <div key={i} style={{
                        ...c.card, height: "100px",
                        background: "#F1F5F9",
                        animation: "pulse 1.5s infinite",
                    }} />
                ))}
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Toast msg={toast} />

            {/* ── Welcome header ── */}
            <div style={{
                ...c.card,
                background: "linear-gradient(135deg,#F0FDFA,#EEF2FF)",
                border: "1px solid #CCFBF1",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                flexWrap: "wrap",
            }}>
                <div style={{
                    width: "56px", height: "56px",
                    borderRadius: "16px", flexShrink: 0,
                    background: "linear-gradient(135deg,#0F766E30,#6366F130)",
                    display: "flex", alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px", fontWeight: 700,
                    color: "#0F766E",
                }}>
                    {initials}
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{
                        fontSize: "20px", fontWeight: 700,
                        color: "#0F172A", margin: 0
                    }}>
                        Dr. {user?.firstName} {user?.lastName}
                    </p>
                    <p style={{
                        fontSize: "13px", color: "#64748B",
                        margin: "4px 0 0"
                    }}>
                        {user?.specialization || "General Practice"} ·{" "}
                        Doctor Portal
                    </p>
                </div>
                <button onClick={fetchAll} style={c.btnSec}>
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* ── Tabs ── */}
            <div style={{
                display: "flex",
                gap: "4px",
                padding: "4px",
                borderRadius: "12px",
                background: "#F1F5F9",
                border: "1px solid #E2E8F0",
                overflowX: "auto",
            }}>
                {TABS.map((t) => (
                    <TabBtn key={t.key}
                        active={tab === t.key}
                        onClick={() => {
                            setTab(t.key);
                            window.__doctorTab = t.key;
                        }}
                        icon={t.icon} label={t.label} />
                ))}
            </div>

            {/* ── Tab content ── */}
            {tab === "dashboard" && (
                <DashboardTab
                    appointments={appointments}
                    patients={patients}
                    prescriptions={prescriptions}
                    diagLogs={diagLogs}
                    doctorStats={doctorStats}
                    getPatientName={getPatientName}
                    onTabChange={setTab}
                />
            )}
            {tab === "patients" && (
                <PatientsTab
                    patients={patients}
                    appointments={appointments}
                    onTabChange={setTab}
                    showToast={showToast}
                />
            )}
            {tab === "appointments" && (
                <AppointmentsTab
                    appointments={appointments}
                    setAppointments={setAppointments}
                    getPatientName={getPatientName}
                    showToast={showToast}
                />
            )}
            {tab === "diagnosis" && (
                <DiagnosisTab
                    patients={patients}        // ← now has real patient names
                    diagLogs={diagLogs}
                    setDiagLogs={setDiagLogs}
                    user={user}
                    showToast={showToast}
                />
            )}

            {tab === "prescriptions" && (
                <PrescriptionsTab
                    patients={patients}        // ← now has real patient names
                    prescriptions={prescriptions}
                    setPrescriptions={setPrescriptions}
                    user={user}
                    showToast={showToast}
                />
            )}
            {tab === "analytics" && (
                <AnalyticsTab
                    appointments={appointments}
                    prescriptions={prescriptions}
                    diagLogs={diagLogs}
                    patients={patients}
                    doctorStats={doctorStats}
                />
            )}
            {tab === "profile" && (
                <ProfileTab user={user} updateUser={updateUser} />
            )}

            <style>{`
            @keyframes spin   { to { transform: rotate(360deg); } }
            @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to   { transform: translateX(0);     opacity: 1; }
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
// TAB 1 — DASHBOARD
// ─────────────────────────────────────────────
function DashboardTab({
    appointments, patients, prescriptions,
    diagLogs, doctorStats, getPatientName, onTabChange,
}) {
    const today = new Date().toDateString();

    const todayAppts = appointments.filter((a) =>
        new Date(a.date).toDateString() === today
    );
    const pending = appointments.filter(
        (a) => a.status === "pending"
    );
    const completed = appointments.filter(
        (a) => a.status === "completed"
    );
    const upcoming = appointments
        .filter((a) =>
            (a.status === "pending" || a.status === "confirmed") &&
            new Date(a.date) > new Date()
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const QUICK_ACTIONS = [
        { label: "AI Diagnosis", icon: Brain, tab: "diagnosis", color: "#6366F1", bg: "#EEF2FF" },
        { label: "Write Prescription", icon: FileText, tab: "prescriptions", color: "#0F766E", bg: "#F0FDFA" },
        { label: "View Patients", icon: Users, tab: "patients", color: "#A855F7", bg: "#FAF5FF" },
        { label: "My Schedule", icon: Calendar, tab: "appointments", color: "#B45309", bg: "#FEF3C7" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Stat cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns:
                    "repeat(auto-fit,minmax(150px,1fr))",
                gap: "14px"
            }}>
                <StatCard icon={Calendar} label="Today's Appointments"
                    value={todayAppts.length} color="#0F766E" bg="#F0FDFA"
                    onClick={() => onTabChange("appointments")} />
                <StatCard icon={Clock} label="Pending"
                    value={pending.length} color="#B45309" bg="#FEF3C7"
                    onClick={() => onTabChange("appointments")} />
                <StatCard icon={Users} label="Total Patients"
                    value={patients.length} color="#A855F7" bg="#FAF5FF"
                    onClick={() => onTabChange("patients")} />
                <StatCard icon={FileText} label="Prescriptions Written"
                    value={doctorStats?.totalPrescriptions ?? prescriptions.length}
                    color="#6366F1" bg="#EEF2FF"
                    onClick={() => onTabChange("prescriptions")} />
                <StatCard icon={Brain} label="AI Diagnoses"
                    value={doctorStats?.totalDiagnoses ?? 0}
                    color="#DC2626" bg="#FEE2E2"
                    onClick={() => onTabChange("diagnosis")} />
                <StatCard icon={CheckCircle2} label="Completed Visits"
                    value={completed.length} color="#15803D" bg="#DCFCE7"
                    onClick={() => onTabChange("appointments")} />
            </div>

            {/* Quick actions */}
            <div style={c.card}>
                <h3 style={{
                    fontSize: "15px", fontWeight: 600,
                    color: "#0F172A", margin: "0 0 14px"
                }}>
                    Quick Actions
                </h3>
                <div style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit,minmax(130px,1fr))",
                    gap: "10px"
                }}>
                    {QUICK_ACTIONS.map((qa) => {
                        const Icon = qa.icon;
                        return (
                            <button key={qa.tab} onClick={() => onTabChange(qa.tab)}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "18px 12px",
                                    borderRadius: "12px",
                                    border: "1px solid #E2E8F0",
                                    background: "#FAFAFA",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = qa.bg;
                                    e.currentTarget.style.borderColor = qa.color + "60";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "#FAFAFA";
                                    e.currentTarget.style.borderColor = "#E2E8F0";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}>
                                <div style={{
                                    width: "40px", height: "40px",
                                    borderRadius: "12px", background: qa.bg,
                                    display: "flex", alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <Icon size={18} style={{ color: qa.color }} />
                                </div>
                                <span style={{
                                    fontSize: "12px", fontWeight: 600,
                                    color: "#475569", textAlign: "center"
                                }}>
                                    {qa.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px"
            }}>

                {/* Upcoming appointments */}
                <div style={c.card}>
                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: "14px"
                    }}>
                        <h3 style={{
                            fontSize: "15px", fontWeight: 600,
                            color: "#0F172A", margin: 0
                        }}>
                            Upcoming Appointments
                        </h3>
                        <button onClick={() => onTabChange("appointments")}
                            style={{
                                ...c.btnSec, padding: "6px 12px",
                                fontSize: "12px"
                            }}>
                            View all
                            <ChevronRight size={13} />
                        </button>
                    </div>

                    {upcoming.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <Calendar size={28} color="#CBD5E1"
                                style={{ marginBottom: "8px" }} />
                            <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
                                No upcoming appointments
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: "flex", flexDirection: "column",
                            gap: "8px"
                        }}>
                            {upcoming.slice(0, 5).map((appt) => (
                                <div key={appt.id} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "10px 12px",
                                    background: "#F8FAFC",
                                    borderRadius: "10px",
                                    border: "1px solid #E2E8F0",
                                    gap: "8px",
                                }}>
                                    <div>
                                        <p style={{
                                            fontSize: "13px", fontWeight: 500,
                                            color: "#0F172A", margin: 0
                                        }}>
                                            {getPatientName(appt.patientId)}
                                        </p>
                                        <p style={{
                                            fontSize: "11px", color: "#94A3B8",
                                            margin: "2px 0 0"
                                        }}>
                                            {new Date(appt.date).toLocaleDateString("en-PK", {
                                                month: "short", day: "numeric",
                                            })} ·{" "}
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

                {/* Recent activity */}
                <div style={c.card}>
                    <h3 style={{
                        fontSize: "15px", fontWeight: 600,
                        color: "#0F172A", margin: "0 0 14px"
                    }}>
                        Recent Activity
                    </h3>
                    {appointments.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <Activity size={28} color="#CBD5E1"
                                style={{ marginBottom: "8px" }} />
                            <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>
                                No activity yet
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: "flex", flexDirection: "column",
                            gap: "0"
                        }}>
                            {appointments.slice(0, 5).map((appt, i) => (
                                <div key={appt.id} style={{
                                    display: "flex",
                                    gap: "12px",
                                    paddingBottom: "12px",
                                    marginBottom: i < 4 ? "12px" : 0,
                                    borderBottom: i < 4 ? "1px solid #F1F5F9" : "none",
                                }}>
                                    <div style={{ flexShrink: 0 }}>
                                        <div style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            background: appt.status === "completed"
                                                ? "#22C55E"
                                                : appt.status === "confirmed"
                                                    ? "#0F766E" : "#F59E0B",
                                            marginTop: "5px",
                                        }} />
                                    </div>
                                    <div>
                                        <p style={{
                                            fontSize: "13px", fontWeight: 500,
                                            color: "#0F172A", margin: 0
                                        }}>
                                            Appointment with{" "}
                                            {getPatientName(appt.patientId)}
                                        </p>
                                        <p style={{
                                            fontSize: "11px", color: "#94A3B8",
                                            margin: "2px 0 0"
                                        }}>
                                            {new Date(appt.date).toLocaleDateString("en-PK", {
                                                month: "short", day: "numeric",
                                                year: "numeric",
                                            })} · {appt.status}
                                        </p>
                                    </div>
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
// TAB 2 — PATIENTS
// ─────────────────────────────────────────────
function PatientsTab({ patients, appointments, onTabChange, showToast }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [viewModal, setViewModal] = useState(null);
    const PER_PAGE = 8;

    const filtered = patients.filter((p) => {
        const q = search.toLowerCase();
        return (
            p.name?.toLowerCase().includes(q) ||
            p.contact?.includes(q) ||
            p.email?.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice(
        (page - 1) * PER_PAGE, page * PER_PAGE
    );

    // Inside PatientsTab component — replace these two helpers:

    const getApptCount = (patientId) =>
        appointments.filter(
            (a) => String(a.patientId) === String(patientId)
        ).length;

    const getLastVisit = (patientId) => {
        const appts = appointments
            .filter(
                (a) =>
                    String(a.patientId) === String(patientId) &&
                    a.status === "completed"
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        return appts[0]
            ? new Date(appts[0].date).toLocaleDateString("en-PK", {
                month: "short",
                day: "numeric",
                year: "numeric",
            })
            : "No visits yet";
    };
    const initials = (name) => {
        if (!name) return "P";
        const parts = name.trim().split(" ");
        return parts.length >= 2
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : name[0].toUpperCase();
    };

    const avatarColors = [
        { bg: "#CCFBF1", color: "#0F766E" },
        { bg: "#EEF2FF", color: "#6366F1" },
        { bg: "#FAF5FF", color: "#A855F7" },
        { bg: "#FEF3C7", color: "#B45309" },
        { bg: "#FEE2E2", color: "#DC2626" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Header */}
            <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", flexWrap: "wrap", gap: "12px"
            }}>
                <div>
                    <h2 style={{
                        fontSize: "20px", fontWeight: 700,
                        color: "#0F172A", margin: 0
                    }}>
                        Patients
                    </h2>
                    <p style={{
                        fontSize: "13px", color: "#94A3B8",
                        margin: "4px 0 0"
                    }}>
                        {filtered.length} patient{filtered.length !== 1 ? "s" : ""} found
                    </p>
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
                        style={{ ...c.input, paddingLeft: "40px" }}
                        placeholder="Search by name, phone or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* Table */}
            <div style={{ ...c.card, padding: 0, overflow: "hidden" }}>

                {/* Table header */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1fr 1fr 1.5fr",
                    padding: "12px 20px",
                    background: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                }}>
                    {["Patient", "Age", "Gender", "Last Visit",
                        "Visits", "Contact", "Actions"].map((h) => (
                            <p key={h} style={{
                                fontSize: "11px", fontWeight: 600,
                                color: "#94A3B8", textTransform: "uppercase",
                                letterSpacing: "0.05em", margin: 0
                            }}>
                                {h}
                            </p>
                        ))}
                </div>

                {paginated.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "50px" }}>
                        <Users size={36} color="#CBD5E1"
                            style={{ marginBottom: "12px" }} />
                        <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
                            No patients found
                        </p>
                    </div>
                ) : (
                    paginated.map((patient, i) => {
                        const av = avatarColors[i % avatarColors.length];
                        return (
                            <div key={patient.id} style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1fr 1fr 1.5fr",
                                padding: "14px 20px",
                                borderBottom: "1px solid #F1F5F9",
                                alignItems: "center",
                                transition: "background 0.1s",
                            }}
                                onMouseEnter={(e) =>
                                    e.currentTarget.style.background = "#F8FAFC"
                                }
                                onMouseLeave={(e) =>
                                    e.currentTarget.style.background = "transparent"
                                }>

                                {/* Name */}
                                <div style={{
                                    display: "flex", alignItems: "center",
                                    gap: "10px"
                                }}>
                                    <div style={{
                                        width: "34px", height: "34px",
                                        borderRadius: "50%", background: av.bg,
                                        display: "flex", alignItems: "center",
                                        justifyContent: "center", fontSize: "12px",
                                        fontWeight: 700, color: av.color, flexShrink: 0,
                                    }}>
                                        {initials(patient.name)}
                                    </div>
                                    <div>
                                        <p style={{
                                            fontSize: "13px", fontWeight: 500,
                                            color: "#0F172A", margin: 0
                                        }}>
                                            {patient.name}
                                        </p>
                                        <p style={{
                                            fontSize: "11px", color: "#94A3B8",
                                            margin: "1px 0 0"
                                        }}>
                                            #{patient.id}
                                        </p>
                                    </div>
                                </div>

                                <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
                                    {patient.age ? `${patient.age} yrs` : "—"}
                                </p>

                                <p style={{
                                    fontSize: "13px", color: "#475569",
                                    margin: 0, textTransform: "capitalize"
                                }}>
                                    {patient.gender || "—"}
                                </p>

                                <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                                    {getLastVisit(patient.id)}
                                </p>

                                <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
                                    {getApptCount(patient.id)}
                                </p>

                                <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                                    {patient.contact || "—"}
                                </p>

                                {/* Actions */}
                                <div style={{
                                    display: "flex", gap: "6px",
                                    flexWrap: "wrap"
                                }}>
                                    <button
                                        onClick={() => setViewModal(patient)}
                                        style={{
                                            padding: "5px 10px",
                                            borderRadius: "8px",
                                            border: "none",
                                            fontSize: "11px",
                                            fontWeight: 500,
                                            cursor: "pointer",
                                            background: "#F0FDFA",
                                            color: "#0F766E",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                        }}>
                                        <Eye size={11} />
                                        View
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        display: "flex", justifyContent: "center",
                        alignItems: "center", gap: "8px",
                        padding: "16px"
                    }}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                            style={{
                                ...c.btnSec, padding: "7px 14px",
                                fontSize: "12px",
                                opacity: page === 1 ? 0.4 : 1
                            }}>
                            Previous
                        </button>
                        <span style={{ fontSize: "13px", color: "#64748B" }}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            style={{
                                ...c.btnSec, padding: "7px 14px",
                                fontSize: "12px",
                                opacity: page === totalPages ? 0.4 : 1
                            }}>
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Patient detail modal */}
            {viewModal && (
                <Modal title={viewModal.name}
                    subtitle={`Patient #${viewModal.id}`}
                    onClose={() => setViewModal(null)} wide>
                    <div style={{
                        display: "flex", flexDirection: "column",
                        gap: "14px"
                    }}>
                        {[
                            { label: "Age", value: viewModal.age ? `${viewModal.age} years` : "—" },
                            { label: "Gender", value: viewModal.gender || "—" },
                            { label: "Blood Group", value: viewModal.bloodGroup || "—" },
                            { label: "Contact", value: viewModal.contact || "—" },
                            { label: "Email", value: viewModal.email || "—" },
                            { label: "Address", value: viewModal.address || "—" },
                            { label: "Total Visits", value: getApptCount(viewModal.id) },
                            { label: "Last Visit", value: getLastVisit(viewModal.id) },
                        ].map((row) => (
                            <div key={row.label} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "10px 0",
                                borderBottom: "1px solid #F1F5F9",
                                gap: "12px",
                            }}>
                                <span style={{
                                    fontSize: "13px", color: "#94A3B8",
                                    flexShrink: 0
                                }}>
                                    {row.label}
                                </span>
                                <span style={{
                                    fontSize: "13px", fontWeight: 500,
                                    color: "#0F172A", textAlign: "right",
                                    textTransform: "capitalize"
                                }}>
                                    {row.value}
                                </span>
                            </div>
                        ))}
                        {viewModal.history && (
                            <div>
                                <p style={{
                                    fontSize: "12px", fontWeight: 600,
                                    color: "#64748B", textTransform: "uppercase",
                                    letterSpacing: "0.04em", margin: "0 0 8px"
                                }}>
                                    Medical History
                                </p>
                                <p style={{
                                    fontSize: "13px", color: "#475569",
                                    lineHeight: 1.6, margin: 0,
                                    padding: "12px",
                                    background: "#F8FAFC",
                                    borderRadius: "10px",
                                    border: "1px solid #E2E8F0"
                                }}>
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

// ─────────────────────────────────────────────
// TAB 3 — APPOINTMENTS
// ─────────────────────────────────────────────
function AppointmentsTab({
    appointments, setAppointments, getPatientName, showToast,
}) {
    const [filter, setFilter] = useState("all");
    const [reschedModal, setReschedModal] = useState(null);
    const [loading, setLoading] = useState({});

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const FILTERS = [
        { key: "all", label: "All" },
        { key: "today", label: "Today" },
        { key: "tomorrow", label: "Tomorrow" },
        { key: "pending", label: "Pending" },
        { key: "confirmed", label: "Confirmed" },
        { key: "completed", label: "Completed" },
        { key: "cancelled", label: "Cancelled" },
    ];

    const filtered = appointments.filter((a) => {
        const d = new Date(a.date);
        d.setHours(0, 0, 0, 0);
        if (filter === "today") return d.getTime() === today.getTime();
        if (filter === "tomorrow") return d.getTime() === tomorrow.getTime();
        if (filter === "pending") return a.status === "pending";
        if (filter === "confirmed") return a.status === "confirmed";
        if (filter === "completed") return a.status === "completed";
        if (filter === "cancelled") return a.status === "cancelled";
        return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleStatus = async (id, status) => {
        setLoading((prev) => ({ ...prev, [id]: true }));
        try {
            await appointmentAPI.update(id, { status });
            setAppointments((prev) =>
                prev.map((a) => a.id === id ? { ...a, status } : a)
            );
            showToast(`Appointment ${status} successfully`);
        } catch (err) {
            showToast("Update failed. Please try again.");
        } finally {
            setLoading((prev) => ({ ...prev, [id]: false }));
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <div>
                <h2 style={{
                    fontSize: "20px", fontWeight: 700,
                    color: "#0F172A", margin: 0
                }}>
                    Appointments
                </h2>
                <p style={{
                    fontSize: "13px", color: "#94A3B8",
                    margin: "4px 0 0"
                }}>
                    {filtered.length} appointment{filtered.length !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Filter pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {FILTERS.map((f) => (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                        style={{
                            padding: "7px 16px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: filter === f.key ? 600 : 400,
                            cursor: "pointer",
                            border: filter === f.key
                                ? "2px solid #0F766E" : "1px solid #E2E8F0",
                            background: filter === f.key ? "#F0FDFA" : "#FFFFFF",
                            color: filter === f.key ? "#0F766E" : "#64748B",
                        }}>
                        {f.label}
                        {f.key !== "all" && (
                            <span style={{
                                marginLeft: "6px", fontSize: "11px",
                                color: filter === f.key
                                    ? "#0F766E" : "#94A3B8"
                            }}>
                                ({appointments.filter((a) => {
                                    const d = new Date(a.date);
                                    d.setHours(0, 0, 0, 0);
                                    if (f.key === "today")
                                        return d.getTime() === today.getTime();
                                    if (f.key === "tomorrow")
                                        return d.getTime() === tomorrow.getTime();
                                    return a.status === f.key;
                                }).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Appointment cards */}
            {filtered.length === 0 ? (
                <div style={{ ...c.card, textAlign: "center", padding: "50px" }}>
                    <Calendar size={36} color="#CBD5E1"
                        style={{ marginBottom: "12px" }} />
                    <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
                        No appointments found
                    </p>
                </div>
            ) : (
                <div style={{
                    display: "flex", flexDirection: "column",
                    gap: "12px"
                }}>
                    {filtered.map((appt) => {
                        const apptDate = new Date(appt.date);
                        const isLoading = loading[appt.id];
                        const canAct = appt.status === "pending" ||
                            appt.status === "confirmed";

                        return (
                            <div key={appt.id} style={c.card}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    flexWrap: "wrap", gap: "12px"
                                }}>

                                    {/* Left — patient info */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center", gap: "14px"
                                    }}>
                                        <div style={{
                                            width: "48px", height: "48px",
                                            borderRadius: "14px", background: "#F0FDFA",
                                            display: "flex", alignItems: "center",
                                            justifyContent: "center", flexShrink: 0,
                                            flexDirection: "column",
                                        }}>
                                            <p style={{
                                                fontSize: "16px", fontWeight: 700,
                                                color: "#0F766E", margin: 0,
                                                lineHeight: 1
                                            }}>
                                                {apptDate.getDate()}
                                            </p>
                                            <p style={{
                                                fontSize: "10px", fontWeight: 600,
                                                color: "#14B8A6", margin: 0,
                                                textTransform: "uppercase"
                                            }}>
                                                {apptDate.toLocaleDateString("en-PK",
                                                    { month: "short" })}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{
                                                fontSize: "15px", fontWeight: 600,
                                                color: "#0F172A", margin: 0
                                            }}>
                                                {getPatientName(appt.patientId)}
                                            </p>
                                            <p style={{
                                                fontSize: "12px", color: "#64748B",
                                                margin: "3px 0 0"
                                            }}>
                                                {apptDate.toLocaleTimeString("en-PK", {
                                                    hour: "2-digit", minute: "2-digit",
                                                })} ·{" "}
                                                {apptDate.toLocaleDateString("en-PK", {
                                                    weekday: "long",
                                                })}
                                            </p>
                                            {appt.reason && (
                                                <p style={{
                                                    fontSize: "12px", color: "#94A3B8",
                                                    margin: "3px 0 0"
                                                }}>
                                                    Reason: {appt.reason}
                                                </p>
                                            )}
                                            {appt.symptoms && (
                                                <p style={{
                                                    fontSize: "12px", color: "#94A3B8",
                                                    margin: "2px 0 0",
                                                    fontStyle: "italic"
                                                }}>
                                                    "{appt.symptoms.slice(0, 80)}
                                                    {appt.symptoms.length > 80 ? "..." : ""}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right — status + actions */}
                                    <div style={{
                                        display: "flex", flexDirection: "column",
                                        alignItems: "flex-end", gap: "8px"
                                    }}>
                                        <StatusBadge status={appt.status} />

                                        {canAct && (
                                            <div style={{
                                                display: "flex", gap: "6px",
                                                flexWrap: "wrap",
                                                justifyContent: "flex-end"
                                            }}>
                                                {appt.status === "pending" && (
                                                    <button
                                                        disabled={isLoading}
                                                        onClick={() =>
                                                            handleStatus(appt.id, "confirmed")
                                                        }
                                                        style={{
                                                            padding: "6px 12px",
                                                            borderRadius: "8px", border: "none",
                                                            fontSize: "12px", fontWeight: 500,
                                                            cursor: "pointer",
                                                            background: "#DCFCE7", color: "#15803D",
                                                            opacity: isLoading ? 0.7 : 1,
                                                        }}>
                                                        {isLoading ? "..." : "✓ Confirm"}
                                                    </button>
                                                )}
                                                {appt.status === "confirmed" && (
                                                    <button
                                                        disabled={isLoading}
                                                        onClick={() =>
                                                            handleStatus(appt.id, "completed")
                                                        }
                                                        style={{
                                                            padding: "6px 12px",
                                                            borderRadius: "8px", border: "none",
                                                            fontSize: "12px", fontWeight: 500,
                                                            cursor: "pointer",
                                                            background: "#EEF2FF", color: "#6366F1",
                                                            opacity: isLoading ? 0.7 : 1,
                                                        }}>
                                                        {isLoading ? "..." : "✓ Complete"}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setReschedModal(appt)}
                                                    style={{
                                                        padding: "6px 12px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #E2E8F0",
                                                        fontSize: "12px", fontWeight: 500,
                                                        cursor: "pointer",
                                                        background: "#FFFFFF", color: "#475569",
                                                    }}>
                                                    Reschedule
                                                </button>
                                                <button
                                                    disabled={isLoading}
                                                    onClick={() =>
                                                        handleStatus(appt.id, "cancelled")
                                                    }
                                                    style={{
                                                        padding: "6px 12px",
                                                        borderRadius: "8px", border: "none",
                                                        fontSize: "12px", fontWeight: 500,
                                                        cursor: "pointer",
                                                        background: "#FEE2E2", color: "#DC2626",
                                                        opacity: isLoading ? 0.7 : 1,
                                                    }}>
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

            {/* Reschedule modal */}
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
                        showToast("Appointment rescheduled successfully");
                    }}
                />
            )}
        </div>
    );
}

function RescheduleModal({ appointment, onClose, onSaved }) {
    const [date, setDate] = useState(
        appointment.date
            ? new Date(appointment.date).toISOString().slice(0, 16)
            : ""
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!date) { setError("Please select a new date"); return; }
        const newDate = new Date(date);
        if (newDate <= new Date()) {
            setError("New date must be in the future"); return;
        }
        setLoading(true);
        try {
            const res = await appointmentAPI.update(
                appointment.id, { date: newDate.toISOString() }
            );
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
            <ErrorBox msg={error} />
            <form onSubmit={handleSubmit}
                style={{
                    display: "flex", flexDirection: "column",
                    gap: "14px"
                }}>
                <div>
                    <label style={c.label}>New Date & Time *</label>
                    <input type="datetime-local" style={c.input}
                        value={date}
                        onChange={(e) => { setDate(e.target.value); setError(""); }} />
                </div>
                <div style={{
                    display: "flex", gap: "10px",
                    paddingTop: "8px",
                    borderTop: "1px solid #E2E8F0"
                }}>
                    <button type="button" onClick={onClose}
                        style={{
                            ...c.btnSec, flex: 1,
                            justifyContent: "center"
                        }}>
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}
                        style={{
                            ...c.btn, flex: 1,
                            justifyContent: "center",
                            opacity: loading ? 0.7 : 1
                        }}>
                        {loading ? "Saving..." : "Reschedule"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─────────────────────────────────────────────
// TAB 4 — AI DIAGNOSIS
// ─────────────────────────────────────────────
function DiagnosisTab({ patients, diagLogs, setDiagLogs, user, showToast }) {
    const [selectedPatient, setSelectedPatient] = useState("");
    const [form, setForm] = useState({
        symptoms: "",
        bp: "",
        temperature: "",
        pulse: "",
        weight: "",
        oxygen: "",
        notes: "",
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const patient = patients.find(
        (p) => String(p.id) === String(selectedPatient)
    );

    const handleGenerate = async (e) => {
        e.preventDefault();
        setError("");
        setResult(null);

        if (!selectedPatient) {
            setError("Please select a patient"); return;
        }
        if (!form.symptoms.trim()) {
            setError("Symptoms are required"); return;
        }

        setLoading(true);
        try {
            const vitals = [
                form.bp && `BP: ${form.bp}`,
                form.temperature && `Temp: ${form.temperature}°C`,
                form.pulse && `Pulse: ${form.pulse} bpm`,
                form.weight && `Weight: ${form.weight} kg`,
                form.oxygen && `O2: ${form.oxygen}%`,
                form.notes && `Notes: ${form.notes}`,
            ].filter(Boolean).join(", ");

            const symptomsText = vitals
                ? `${form.symptoms}. Vitals — ${vitals}`
                : form.symptoms;

            const res = await aiAPI.symptomChecker({
                symptoms: symptomsText,
                age: patient?.age || 30,
                gender: patient?.gender || "unknown",
                history: patient?.history || "",
                patientId: selectedPatient,
            });

            setResult(res.data.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "AI analysis failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        setSaving(true);
        try {
            showToast("Diagnosis saved to patient record");
            setSuccess("Diagnosis saved successfully. Patient can view it in their AI & Health tab.");
            // The DiagnosisLog is already saved by the backend
            // when symptomChecker was called. Refresh logs.
            const logsRes = await aiAPI.getLogs();
            setDiagLogs(logsRes.data.data || []);
        } catch (err) {
            setError("Failed to save diagnosis");
        } finally {
            setSaving(false);
        }
    };

    const RISK_COLORS = {
        low: { bg: "#DCFCE7", color: "#15803D", border: "#BBF7D0" },
        medium: { bg: "#FEF3C7", color: "#B45309", border: "#FDE68A" },
        high: { bg: "#FEE2E2", color: "#DC2626", border: "#FECACA" },
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div>
                <div style={{
                    display: "flex", alignItems: "center",
                    gap: "10px", marginBottom: "4px"
                }}>
                    <h2 style={{
                        fontSize: "20px", fontWeight: 700,
                        color: "#0F172A", margin: 0
                    }}>
                        AI Diagnosis
                    </h2>
                    <span style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: "#EEF2FF",
                        color: "#6366F1",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}>
                        <Sparkles size={11} />
                        {/* Powered by Gemini */}
                    </span>
                </div>
                <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
                    Enter patient vitals and symptoms for AI-powered diagnosis
                </p>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                alignItems: "start"
            }}>

                {/* ── Diagnosis form ── */}
                <div style={c.card}>
                    <h3 style={{
                        fontSize: "15px", fontWeight: 600,
                        color: "#0F172A", margin: "0 0 16px"
                    }}>
                        Patient & Vitals
                    </h3>

                    <ErrorBox msg={error} />

                    <form onSubmit={handleGenerate}
                        style={{
                            display: "flex", flexDirection: "column",
                            gap: "14px"
                        }}>

                        {/* Patient select */}
                        <div>
                            <label style={c.label}>Select Patient *</label>
                            <select
                                style={{ ...c.input, cursor: "pointer" }}
                                value={selectedPatient}
                                onChange={(e) => {
                                    setSelectedPatient(e.target.value);
                                    setError("");
                                    setResult(null);
                                    setSuccess("");
                                }}>
                                <option value="">Choose a patient...</option>
                                {patients.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                        {p.age ? ` (${p.age} yrs)` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Patient info pill */}
                        {patient && (
                            <div style={{
                                padding: "10px 14px",
                                background: "#F0FDFA",
                                borderRadius: "10px",
                                border: "1px solid #CCFBF1",
                                fontSize: "12px",
                                color: "#475569",
                            }}>
                                <strong style={{ color: "#0F172A" }}>
                                    {patient.name}
                                </strong>
                                {patient.age && ` · ${patient.age} yrs`}
                                {patient.gender && ` · ${patient.gender}`}
                                {patient.bloodGroup && ` · ${patient.bloodGroup}`}
                                {patient.history && (
                                    <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>
                                        History: {patient.history.slice(0, 100)}
                                        {patient.history.length > 100 ? "..." : ""}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Symptoms */}
                        <div>
                            <label style={c.label}>
                                Symptoms <span style={{ color: "#EF4444" }}>*</span>
                            </label>
                            <textarea
                                style={{ ...c.input, height: "90px", resize: "none" }}
                                placeholder="Describe all symptoms in detail..."
                                value={form.symptoms}
                                onChange={(e) => setForm((p) => ({
                                    ...p, symptoms: e.target.value,
                                }))}
                            />
                        </div>

                        {/* Vitals grid */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "10px"
                        }}>
                            {[
                                { key: "bp", label: "Blood Pressure", ph: "120/80 mmHg" },
                                { key: "temperature", label: "Temperature", ph: "37.0 °C" },
                                { key: "pulse", label: "Pulse", ph: "72 bpm" },
                                { key: "weight", label: "Weight", ph: "70 kg" },
                                { key: "oxygen", label: "Oxygen Level", ph: "98%" },
                            ].map((field) => (
                                <div key={field.key}>
                                    <label style={c.label}>{field.label}</label>
                                    <input
                                        style={c.input}
                                        placeholder={field.ph}
                                        value={form[field.key]}
                                        onChange={(e) => setForm((p) => ({
                                            ...p, [field.key]: e.target.value,
                                        }))}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Notes */}
                        <div>
                            <label style={c.label}>Additional Notes</label>
                            <textarea
                                style={{ ...c.input, height: "70px", resize: "none" }}
                                placeholder="Any additional clinical observations..."
                                value={form.notes}
                                onChange={(e) => setForm((p) => ({
                                    ...p, notes: e.target.value,
                                }))}
                            />
                        </div>

                        <button type="submit" disabled={loading}
                            style={{
                                ...c.btn, justifyContent: "center",
                                opacity: loading ? 0.7 : 1
                            }}>
                            {loading ? (
                                <>
                                    <Loader size={15}
                                        style={{
                                            animation:
                                                "spin 0.8s linear infinite"
                                        }} />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Brain size={15} />
                                    Generate AI Diagnosis
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* ── AI Result ── */}
                <div style={{
                    display: "flex", flexDirection: "column",
                    gap: "14px"
                }}>

                    {!result && !loading && (
                        <div style={{
                            ...c.card, textAlign: "center",
                            padding: "50px 24px"
                        }}>
                            <div style={{
                                width: "64px", height: "64px",
                                borderRadius: "20px",
                                background: "linear-gradient(135deg,#EEF2FF,#F0FDFA)",
                                display: "flex", alignItems: "center",
                                justifyContent: "center", margin: "0 auto 14px",
                            }}>
                                <Brain size={28} color="#6366F1" />
                            </div>
                            <p style={{
                                fontSize: "15px", fontWeight: 500,
                                color: "#475569", margin: 0
                            }}>
                                AI results will appear here
                            </p>
                            <p style={{
                                fontSize: "13px", color: "#94A3B8",
                                marginTop: "6px"
                            }}>
                                Select a patient and fill in the symptoms
                            </p>
                        </div>
                    )}

                    {loading && (
                        <div style={{
                            ...c.card, textAlign: "center",
                            padding: "50px 24px"
                        }}>
                            <Loader size={32} color="#6366F1"
                                style={{
                                    animation: "spin 0.8s linear infinite",
                                    margin: "0 auto 14px"
                                }} />
                            <p style={{
                                fontSize: "15px", fontWeight: 500,
                                color: "#475569", margin: 0
                            }}>
                                Gemini AI is analyzing...
                            </p>
                            <div style={{
                                display: "flex", justifyContent: "center",
                                gap: "6px", marginTop: "12px"
                            }}>
                                {[0, 1, 2].map((i) => (
                                    <span key={i} style={{
                                        width: "8px", height: "8px", borderRadius: "50%",
                                        background: "#6366F1", display: "inline-block",
                                        animation: `bounce 0.8s ${i * 0.15}s infinite`,
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {result && !loading && (
                        <>
                            <SuccessBox msg={success} />

                            {/* Risk level */}
                            {result.result?.riskLevel && (() => {
                                const rc = RISK_COLORS[result.result.riskLevel] ||
                                    RISK_COLORS.low;
                                return (
                                    <div style={{
                                        ...c.card,
                                        background: rc.bg,
                                        border: `1px solid ${rc.border}`,
                                    }}>
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "12px"
                                        }}>
                                            <div>
                                                <p style={{
                                                    fontSize: "12px", fontWeight: 600,
                                                    color: rc.color, textTransform: "uppercase",
                                                    letterSpacing: "0.04em", margin: 0
                                                }}>
                                                    Risk Level
                                                </p>
                                                <p style={{
                                                    fontSize: "20px", fontWeight: 700,
                                                    color: rc.color, margin: "4px 0 0",
                                                    textTransform: "capitalize"
                                                }}>
                                                    {result.result.riskLevel}
                                                </p>
                                            </div>
                                            {result.result.urgency && (
                                                <span style={{
                                                    padding: "6px 14px",
                                                    borderRadius: "20px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    background: "#FFFFFF60",
                                                    color: rc.color,
                                                    textTransform: "capitalize",
                                                }}>
                                                    {result.result.urgency}
                                                </span>
                                            )}
                                        </div>
                                        {/* Risk bar */}
                                        <div style={{
                                            height: "8px", borderRadius: "4px",
                                            background: "#FFFFFF60",
                                            overflow: "hidden"
                                        }}>
                                            <div style={{
                                                height: "100%",
                                                borderRadius: "4px",
                                                width: result.result.riskLevel === "low"
                                                    ? "33%" : result.result.riskLevel === "medium"
                                                        ? "66%" : "100%",
                                                background: rc.color,
                                                transition: "width 0.7s ease",
                                            }} />
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Summary */}
                            {result.result?.summary && (
                                <div style={c.card}>
                                    <p style={{
                                        fontSize: "12px", fontWeight: 600,
                                        color: "#94A3B8", textTransform: "uppercase",
                                        letterSpacing: "0.04em", margin: "0 0 8px"
                                    }}>
                                        Clinical Summary
                                    </p>
                                    <p style={{
                                        fontSize: "14px", color: "#475569",
                                        lineHeight: 1.7, margin: 0
                                    }}>
                                        {result.result.summary}
                                    </p>
                                </div>
                            )}

                            {/* Possible conditions */}
                            {result.result?.possibleConditions?.length > 0 && (
                                <div style={c.card}>
                                    <p style={{
                                        fontSize: "12px", fontWeight: 600,
                                        color: "#94A3B8", textTransform: "uppercase",
                                        letterSpacing: "0.04em", margin: "0 0 10px"
                                    }}>
                                        Possible Conditions
                                    </p>
                                    <div style={{
                                        display: "flex", flexDirection: "column",
                                        gap: "6px"
                                    }}>
                                        {result.result.possibleConditions.map((cond, i) => (
                                            <div key={i} style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                                padding: "10px 12px",
                                                background: "#F8FAFC",
                                                borderRadius: "10px",
                                                border: "1px solid #E2E8F0",
                                            }}>
                                                <span style={{
                                                    width: "22px", height: "22px",
                                                    borderRadius: "50%", background: "#CCFBF1",
                                                    display: "flex", alignItems: "center",
                                                    justifyContent: "center", fontSize: "11px",
                                                    fontWeight: 700, color: "#0F766E",
                                                    flexShrink: 0,
                                                }}>
                                                    {i + 1}
                                                </span>
                                                <span style={{
                                                    fontSize: "13px", fontWeight: 500,
                                                    color: "#0F172A"
                                                }}>
                                                    {cond}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggested tests */}
                            {result.result?.suggestedTests?.length > 0 && (
                                <div style={c.card}>
                                    <p style={{
                                        fontSize: "12px", fontWeight: 600,
                                        color: "#94A3B8", textTransform: "uppercase",
                                        letterSpacing: "0.04em", margin: "0 0 10px"
                                    }}>
                                        Suggested Tests
                                    </p>
                                    <div style={{
                                        display: "flex", flexWrap: "wrap",
                                        gap: "8px"
                                    }}>
                                        {result.result.suggestedTests.map((test, i) => (
                                            <span key={i} style={{
                                                padding: "6px 12px",
                                                borderRadius: "20px",
                                                fontSize: "12px",
                                                fontWeight: 500,
                                                background: "#FAF5FF",
                                                color: "#7E22CE",
                                                border: "1px solid #E9D5FF",
                                            }}>
                                                {test}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        ...c.btn, flex: 1,
                                        justifyContent: "center",
                                        opacity: saving ? 0.7 : 1
                                    }}>
                                    {saving ? (
                                        <>
                                            <Loader size={15}
                                                style={{
                                                    animation:
                                                        "spin 0.8s linear infinite"
                                                }} />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={15} />
                                            Save Diagnosis
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setResult(null);
                                        setSuccess("");
                                    }}
                                    style={{
                                        ...c.btnSec, flex: 1,
                                        justifyContent: "center"
                                    }}>
                                    <RefreshCw size={14} />
                                    Regenerate
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Recent diagnosis logs */}
            {diagLogs.length > 0 && (
                <div style={c.card}>
                    <h3 style={{
                        fontSize: "15px", fontWeight: 600,
                        color: "#0F172A", margin: "0 0 14px"
                    }}>
                        Recent AI Diagnoses
                    </h3>
                    <div style={{
                        display: "flex", flexDirection: "column",
                        gap: "10px"
                    }}>
                        {diagLogs.slice(0, 5).map((log) => {
                            const rc = RISK_COLORS[log.riskLevel] || RISK_COLORS.low;
                            return (
                                <div key={log.id} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "12px 14px",
                                    background: "#F8FAFC",
                                    borderRadius: "10px",
                                    border: "1px solid #E2E8F0",
                                    flexWrap: "wrap",
                                    gap: "8px",
                                }}>
                                    <div>
                                        <p style={{
                                            fontSize: "13px", fontWeight: 500,
                                            color: "#0F172A", margin: 0
                                        }}>
                                            Patient #{log.patientId || "—"}
                                        </p>
                                        <p style={{
                                            fontSize: "12px", color: "#94A3B8",
                                            margin: "2px 0 0"
                                        }}>
                                            {log.symptoms?.slice(0, 60)}
                                            {log.symptoms?.length > 60 ? "..." : ""}
                                        </p>
                                    </div>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center", gap: "8px"
                                    }}>
                                        <span style={{
                                            padding: "3px 10px",
                                            borderRadius: "20px",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            background: rc.bg,
                                            color: rc.color,
                                        }}>
                                            {log.riskLevel} risk
                                        </span>
                                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                                            {new Date(log.createdAt).toLocaleDateString("en-PK", {
                                                month: "short", day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style>{`
            @keyframes bounce {
            0%,100% { transform: translateY(0); }
            50%      { transform: translateY(-6px); }
            }
        `}</style>
        </div>
    );
}

// ─────────────────────────────────────────────
// TAB 5 — PRESCRIPTIONS
// ─────────────────────────────────────────────
function PrescriptionsTab({
    patients, prescriptions, setPrescriptions, user, showToast,
}) {
    const [showBuilder, setShowBuilder] = useState(false);
    const [filter, setFilter] = useState("all");
    const [downloading, setDownloading] = useState(null);
    const [aiLoading, setAiLoading] = useState(null);

    const filtered = filter === "all"
        ? prescriptions
        : prescriptions.filter((p) => p.status === filter);

    const getDoctorPrescriptions = prescriptions.filter(
        (p) => p.doctorId === user.id
    );

    const getPatientName = (id) => {
        const p = patients.find((p) => p.id === id);
        return p ? p.name : `Patient #${id}`;
    };

    const handleDownload = async (id) => {
        setDownloading(id);
        try {
            const res = await prescriptionAPI.download(id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `prescription_${id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        } finally {
            setDownloading(null);
        }
    };

    const handleAIExplain = async (pres) => {
        setAiLoading(pres.id);
        try {
            const meds = Array.isArray(pres.medicines) ? pres.medicines : [];
            const res = await aiAPI.prescriptionExplanation({
                medicines: meds,
                instructions: pres.instructions || "",
                language: "english",
                prescriptionId: pres.id,
            });
            const explanation = res.data.data.explanation;
            setPrescriptions((prev) =>
                prev.map((p) =>
                    p.id === pres.id ? { ...p, aiExplanation: explanation } : p
                )
            );
            showToast("AI explanation generated and saved");
        } catch (err) {
            showToast("AI explanation failed. Please try again.");
        } finally {
            setAiLoading(null);
        }
    };

    const handleSaved = (newPres) => {
        setPrescriptions((prev) => [newPres, ...prev]);
        setShowBuilder(false);
        showToast("Prescription created successfully");
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Header */}
            <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", flexWrap: "wrap", gap: "12px"
            }}>
                <div>
                    <h2 style={{
                        fontSize: "20px", fontWeight: 700,
                        color: "#0F172A", margin: 0
                    }}>
                        Prescriptions
                    </h2>
                    <p style={{
                        fontSize: "13px", color: "#94A3B8",
                        margin: "4px 0 0"
                    }}>
                        {getDoctorPrescriptions.length} prescription
                        {getDoctorPrescriptions.length !== 1 ? "s" : ""} written
                    </p>
                </div>
                <button onClick={() => setShowBuilder(true)} style={c.btn}>
                    <Plus size={15} />
                    New Prescription
                </button>
            </div>

            {/* Filter pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["all", "active", "completed", "cancelled"].map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{
                            padding: "7px 16px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: filter === f ? 600 : 400,
                            cursor: "pointer",
                            border: filter === f
                                ? "2px solid #0F766E" : "1px solid #E2E8F0",
                            background: filter === f ? "#F0FDFA" : "#FFFFFF",
                            color: filter === f ? "#0F766E" : "#64748B",
                            textTransform: "capitalize",
                        }}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Prescriptions */}
            {filtered.length === 0 ? (
                <div style={{ ...c.card, textAlign: "center", padding: "50px" }}>
                    <FileText size={36} color="#CBD5E1"
                        style={{ marginBottom: "12px" }} />
                    <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
                        No prescriptions found
                    </p>
                    <button onClick={() => setShowBuilder(true)}
                        style={{
                            ...c.btn, marginTop: "16px",
                            display: "inline-flex"
                        }}>
                        Write First Prescription
                    </button>
                </div>
            ) : (
                <div style={{
                    display: "flex", flexDirection: "column",
                    gap: "12px"
                }}>
                    {filtered.map((pres) => {
                        const medicines = Array.isArray(pres.medicines)
                            ? pres.medicines : [];
                        const isDown = downloading === pres.id;
                        const isAI = aiLoading === pres.id;

                        return (
                            <div key={pres.id} style={c.card}>

                                {/* Header */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "14px",
                                    flexWrap: "wrap", gap: "10px"
                                }}>
                                    <div>
                                        <p style={{
                                            fontSize: "15px", fontWeight: 600,
                                            color: "#0F172A", margin: 0
                                        }}>
                                            {getPatientName(pres.patientId)}
                                        </p>
                                        <p style={{
                                            fontSize: "12px", color: "#94A3B8",
                                            margin: "3px 0 0"
                                        }}>
                                            Prescription #{pres.id} ·{" "}
                                            {new Date(pres.createdAt).toLocaleDateString("en-PK", {
                                                day: "numeric", month: "long", year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <StatusBadge status={pres.status} />
                                </div>

                                {/* Medicines */}
                                <div style={{
                                    display: "flex", flexWrap: "wrap",
                                    gap: "6px", marginBottom: "12px"
                                }}>
                                    {medicines.map((med, i) => (
                                        <span key={i} style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "5px",
                                            padding: "5px 10px",
                                            borderRadius: "20px",
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            background: "#F0FDFA",
                                            color: "#0F766E",
                                            border: "1px solid #CCFBF1",
                                        }}>
                                            <Pill size={10} />
                                            {med.name}
                                            {med.dosage && (
                                                <span style={{
                                                    color: "#64748B",
                                                    fontWeight: 400
                                                }}>
                                                    · {med.dosage}
                                                </span>
                                            )}
                                        </span>
                                    ))}
                                </div>

                                {pres.instructions && (
                                    <p style={{
                                        fontSize: "12px", color: "#64748B",
                                        padding: "8px 12px",
                                        background: "#FFFBEB",
                                        borderRadius: "8px",
                                        border: "1px solid #FDE68A",
                                        margin: "0 0 12px"
                                    }}>
                                        {pres.instructions}
                                    </p>
                                )}

                                {pres.aiExplanation && (
                                    <div style={{
                                        padding: "10px 12px",
                                        background: "#EEF2FF",
                                        borderRadius: "8px",
                                        border: "1px solid #C7D2FE",
                                        marginBottom: "12px",
                                        fontSize: "12px",
                                        color: "#4F46E5",
                                    }}>
                                        <strong>AI:</strong>{" "}
                                        {pres.aiExplanation.slice(0, 120)}
                                        {pres.aiExplanation.length > 120 ? "..." : ""}
                                    </div>
                                )}

                                {/* Actions */}
                                <div style={{
                                    display: "flex", gap: "8px",
                                    paddingTop: "12px",
                                    borderTop: "1px solid #E2E8F0",
                                    flexWrap: "wrap"
                                }}>
                                    <button
                                        onClick={() => handleDownload(pres.id)}
                                        disabled={isDown}
                                        style={{
                                            ...c.btnSec, flex: 1,
                                            justifyContent: "center",
                                            opacity: isDown ? 0.7 : 1
                                        }}>
                                        {isDown ? (
                                            <Loader size={13}
                                                style={{
                                                    animation:
                                                        "spin 0.8s linear infinite"
                                                }} />
                                        ) : <Download size={13} />}
                                        Download PDF
                                    </button>
                                    <button
                                        onClick={() => handleAIExplain(pres)}
                                        disabled={isAI}
                                        style={{
                                            ...c.btnSec, flex: 1,
                                            justifyContent: "center",
                                            background: "#EEF2FF",
                                            border: "1px solid #C7D2FE",
                                            color: "#6366F1",
                                            opacity: isAI ? 0.7 : 1,
                                        }}>
                                        {isAI ? (
                                            <Loader size={13}
                                                style={{
                                                    animation:
                                                        "spin 0.8s linear infinite"
                                                }} />
                                        ) : <Sparkles size={13} />}
                                        AI Explain
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Prescription builder modal */}
            {showBuilder && (
                <PrescriptionBuilder
                    patients={patients}
                    user={user}
                    onClose={() => setShowBuilder(false)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}

function PrescriptionBuilder({ patients, user, onClose, onSaved }) {
    const [form, setForm] = useState({
        patientId: "",
        instructions: "",
        notes: "",
        status: "active",
    });
    const [medicines, setMedicines] = useState([
        { name: "", dosage: "", frequency: "", duration: "" },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const addMed = () =>
        setMedicines((prev) => [
            ...prev,
            { name: "", dosage: "", frequency: "", duration: "" },
        ]);

    const removeMed = (i) => {
        if (medicines.length === 1) return;
        setMedicines((prev) => prev.filter((_, idx) => idx !== i));
    };

    const updateMed = (i, field, value) =>
        setMedicines((prev) =>
            prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m)
        );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.patientId) {
            setError("Please select a patient"); return;
        }
        const validMeds = medicines.filter((m) => m.name.trim());
        if (validMeds.length === 0) {
            setError("At least one medicine name is required"); return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await prescriptionAPI.create({
                patientId: form.patientId,
                doctorId: user.id,
                medicines: validMeds,
                instructions: form.instructions,
                status: form.status,
            });
            onSaved(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create prescription");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title="New Prescription"
            subtitle="Create a prescription for a patient"
            onClose={onClose} wide>
            <ErrorBox msg={error} />
            <form onSubmit={handleSubmit}
                style={{
                    display: "flex", flexDirection: "column",
                    gap: "16px"
                }}>

                {/* Patient */}
                <div>
                    <label style={c.label}>
                        Patient <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <select
                        style={{ ...c.input, cursor: "pointer" }}
                        value={form.patientId}
                        onChange={(e) => {
                            setForm((p) => ({ ...p, patientId: e.target.value }));
                            setError("");
                        }}>
                        <option value="">Select patient...</option>
                        {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Medicines */}
                <div>
                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: "10px"
                    }}>
                        <label style={{ ...c.label, marginBottom: 0 }}>
                            Medicines <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <button type="button" onClick={addMed}
                            style={{
                                ...c.btnSec, padding: "5px 12px",
                                fontSize: "12px",
                            }}>
                            <Plus size={12} />
                            Add
                        </button>
                    </div>

                    <div style={{
                        display: "flex", flexDirection: "column",
                        gap: "10px"
                    }}>
                        {medicines.map((med, i) => (
                            <div key={i} style={{
                                padding: "14px",
                                background: "#F8FAFC",
                                borderRadius: "12px",
                                border: "1px solid #E2E8F0",
                            }}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "10px"
                                }}>
                                    <span style={{
                                        fontSize: "12px", fontWeight: 600,
                                        color: "#64748B"
                                    }}>
                                        Medicine {i + 1}
                                    </span>
                                    {medicines.length > 1 && (
                                        <button type="button" onClick={() => removeMed(i)}
                                            style={{
                                                background: "none", border: "none",
                                                cursor: "pointer", color: "#94A3B8",
                                                padding: 0
                                            }}>
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1fr 1fr 1fr",
                                    gap: "8px"
                                }}>
                                    {[
                                        { key: "name", ph: "Medicine name *" },
                                        { key: "dosage", ph: "Dosage (5mg)" },
                                        { key: "frequency", ph: "Once daily" },
                                        { key: "duration", ph: "7 days" },
                                    ].map((f) => (
                                        <input key={f.key}
                                            style={{
                                                ...c.input, fontSize: "12px",
                                                padding: "8px 10px"
                                            }}
                                            placeholder={f.ph}
                                            value={med[f.key]}
                                            onChange={(e) =>
                                                updateMed(i, f.key, e.target.value)
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <div>
                    <label style={c.label}>Instructions</label>
                    <textarea
                        style={{ ...c.input, height: "80px", resize: "none" }}
                        placeholder="Take after meals. Avoid alcohol..."
                        value={form.instructions}
                        onChange={(e) => setForm((p) =>
                            ({ ...p, instructions: e.target.value }))}
                    />
                </div>

                {/* Status */}
                <div>
                    <label style={c.label}>Status</label>
                    <select style={{ ...c.input, cursor: "pointer" }}
                        value={form.status}
                        onChange={(e) => setForm((p) =>
                            ({ ...p, status: e.target.value }))}>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <div style={{
                    display: "flex", gap: "10px",
                    paddingTop: "8px",
                    borderTop: "1px solid #E2E8F0"
                }}>
                    <button type="button" onClick={onClose}
                        style={{
                            ...c.btnSec, flex: 1,
                            justifyContent: "center"
                        }}>
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}
                        style={{
                            ...c.btn, flex: 1,
                            justifyContent: "center",
                            opacity: loading ? 0.7 : 1
                        }}>
                        {loading ? "Creating..." : "Create Prescription"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─────────────────────────────────────────────
// TAB 6 — ANALYTICS
// ─────────────────────────────────────────────
function AnalyticsTab({
    appointments, prescriptions, diagLogs, patients, doctorStats,
}) {
    // ── Weekly appointments (last 7 days) ──
    const weeklyData = (() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const count = appointments.filter((a) => {
                const ad = new Date(a.date);
                ad.setHours(0, 0, 0, 0);
                return ad.getTime() === d.getTime();
            }).length;
            days.push({
                day: d.toLocaleDateString("en-PK", { weekday: "short" }),
                count,
            });
        }
        return days;
    })();

    // ── Monthly patients (last 6 months) ──
    const monthlyData = (() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const y = d.getFullYear();
            const m = d.getMonth();
            const count = appointments.filter((a) => {
                const ad = new Date(a.date);
                return ad.getFullYear() === y && ad.getMonth() === m;
            }).length;
            months.push({
                month: d.toLocaleDateString("en-PK", { month: "short" }),
                count,
            });
        }
        return months;
    })();

    // ── Status distribution ──
    const statusData = [
        { name: "Pending", value: appointments.filter(a => a.status === "pending").length, color: "#F59E0B" },
        { name: "Confirmed", value: appointments.filter(a => a.status === "confirmed").length, color: "#0F766E" },
        { name: "Completed", value: appointments.filter(a => a.status === "completed").length, color: "#22C55E" },
        { name: "Cancelled", value: appointments.filter(a => a.status === "cancelled").length, color: "#EF4444" },
    ].filter((d) => d.value > 0);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload?.length) {
            return (
                <div style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}>
                    <p style={{ color: "#64748B", margin: "0 0 4px" }}>{label}</p>
                    {payload.map((p) => (
                        <p key={p.name} style={{
                            color: p.color || "#0F766E",
                            fontWeight: 600, margin: 0
                        }}>
                            {p.value} {p.name}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div>
                <h2 style={{
                    fontSize: "20px", fontWeight: 700,
                    color: "#0F172A", margin: 0
                }}>
                    Analytics
                </h2>
                <p style={{
                    fontSize: "13px", color: "#94A3B8",
                    margin: "4px 0 0"
                }}>
                    Your performance overview
                </p>
            </div>

            {/* Summary stat cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns:
                    "repeat(auto-fit,minmax(140px,1fr))",
                gap: "14px"
            }}>
            {/* // Inside AnalyticsTab — replace the summary cards array: */}
                {[
                    {
                        label: "Total Appointments",
                        value: appointments.length,          // ← doctor's own appointments
                        color: "#0F766E", bg: "#F0FDFA"
                    },
                    {
                        label: "Total Patients",
                        value: patients.length,              // ← doctor's own patients
                        color: "#6366F1", bg: "#EEF2FF"
                    },
                    {
                        label: "Prescriptions Written",
                        value: prescriptions.length,         // ← doctor's own prescriptions
                        color: "#A855F7", bg: "#FAF5FF"
                    },
                    {
                        label: "AI Diagnoses",
                        value: diagLogs.length,              // ← doctor's own logs
                        color: "#B45309", bg: "#FEF3C7"
                    },
                    {
                        label: "Completed Visits",
                        value: appointments.filter(
                            (a) => a.status === "completed"
                        ).length,
                        color: "#15803D", bg: "#DCFCE7"
                    },
                ].map((s) => (
                    <div key={s.label} style={{ ...c.card, padding: "16px" }}>
                        <p style={{
                            fontSize: "24px", fontWeight: 700,
                            color: s.color, margin: 0
                        }}>
                            {s.value}
                        </p>
                        <p style={{
                            fontSize: "12px", color: "#94A3B8",
                            margin: "4px 0 0"
                        }}>
                            {s.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Charts grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px"
            }}>

                {/* Weekly appointments */}
                <div style={c.card}>
                    <h3 style={{
                        fontSize: "14px", fontWeight: 600,
                        color: "#0F172A", margin: "0 0 16px"
                    }}>
                        Appointments This Week
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weeklyData}
                            margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="day"
                                tick={{ fill: "#94A3B8", fontSize: 11 }}
                                axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }}
                                axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="Appointments"
                                fill="#0F766E" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Monthly trend */}
                <div style={c.card}>
                    <h3 style={{
                        fontSize: "14px", fontWeight: 600,
                        color: "#0F172A", margin: "0 0 16px"
                    }}>
                        Monthly Appointments
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={monthlyData}
                            margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount"
                                    x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1"
                                        stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366F1"
                                        stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="month"
                                tick={{ fill: "#94A3B8", fontSize: 11 }}
                                axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }}
                                axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="count"
                                name="Appointments"
                                stroke="#6366F1" strokeWidth={2}
                                fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Status distribution */}
                {statusData.length > 0 && (
                    <div style={c.card}>
                        <h3 style={{
                            fontSize: "14px", fontWeight: 600,
                            color: "#0F172A", margin: "0 0 16px"
                        }}>
                            Appointment Status
                        </h3>
                        <div style={{
                            display: "flex", gap: "20px",
                            alignItems: "center"
                        }}>
                            <ResponsiveContainer width="50%" height={160}>
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%"
                                        innerRadius={45} outerRadius={70}
                                        paddingAngle={3} dataKey="value">
                                        {statusData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(v) => [v, "appointments"]}
                                        contentStyle={{
                                            background: "#FFFFFF",
                                            border: "1px solid #E2E8F0",
                                            borderRadius: "10px",
                                            fontSize: "12px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{
                                flex: 1, display: "flex",
                                flexDirection: "column", gap: "8px"
                            }}>
                                {statusData.map((d) => (
                                    <div key={d.name} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        fontSize: "12px",
                                    }}>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center", gap: "6px"
                                        }}>
                                            <span style={{
                                                width: "10px", height: "10px",
                                                borderRadius: "50%",
                                                background: d.color,
                                                flexShrink: 0
                                            }} />
                                            <span style={{ color: "#64748B" }}>{d.name}</span>
                                        </div>
                                        <span style={{
                                            fontWeight: 600,
                                            color: "#0F172A"
                                        }}>
                                            {d.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Prescriptions vs diagnoses */}
                <div style={c.card}>
                    <h3 style={{
                        fontSize: "14px", fontWeight: 600,
                        color: "#0F172A", margin: "0 0 16px"
                    }}>
                        Activity Overview
                    </h3>
                    <div style={{
                        display: "flex", flexDirection: "column",
                        gap: "12px"
                    }}>
                        {[
                            {
                                label: "Prescriptions Written",
                                value: prescriptions.length,
                                max: Math.max(prescriptions.length, diagLogs.length, 1),
                                color: "#0F766E"
                            },
                            {
                                label: "AI Diagnoses Run",
                                value: diagLogs.length,
                                max: Math.max(prescriptions.length, diagLogs.length, 1),
                                color: "#6366F1"
                            },
                            {
                                label: "Patients Seen",
                                value: patients.length,
                                max: Math.max(patients.length, 1),
                                color: "#A855F7"
                            },
                        ].map((item) => (
                            <div key={item.label}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "4px"
                                }}>
                                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                                        {item.label}
                                    </span>
                                    <span style={{
                                        fontSize: "12px", fontWeight: 600,
                                        color: "#0F172A"
                                    }}>
                                        {item.value}
                                    </span>
                                </div>
                                <div style={{
                                    height: "8px", borderRadius: "4px",
                                    background: "#F1F5F9", overflow: "hidden"
                                }}>
                                    <div style={{
                                        height: "100%",
                                        borderRadius: "4px",
                                        width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                                        background: item.color,
                                        transition: "width 0.7s ease",
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// TAB 7 — PROFILE
// ─────────────────────────────────────────────
function ProfileTab({ user, updateUser }) {
    const [profileTab, setProfileTab] = useState("info");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
                <h2 style={{
                    fontSize: "20px", fontWeight: 700,
                    color: "#0F172A", margin: 0
                }}>
                    Profile Settings
                </h2>
                <p style={{
                    fontSize: "13px", color: "#94A3B8",
                    margin: "4px 0 0"
                }}>
                    Manage your professional information
                </p>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: "flex", gap: "8px" }}>
                {[
                    { key: "info", label: "Professional Info" },
                    { key: "password", label: "Change Password" },
                ].map((t) => (
                    <button key={t.key} onClick={() => setProfileTab(t.key)}
                        style={{
                            padding: "8px 18px",
                            borderRadius: "10px",
                            border: "none",
                            fontSize: "14px",
                            fontWeight: profileTab === t.key ? 600 : 400,
                            cursor: "pointer",
                            background: profileTab === t.key
                                ? "linear-gradient(135deg,#0F766E,#6366F1)"
                                : "#F1F5F9",
                            color: profileTab === t.key
                                ? "#FFFFFF" : "#64748B",
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {profileTab === "info" && (
                <DoctorProfileInfo user={user} updateUser={updateUser} />
            )}
            {profileTab === "password" && (
                <DoctorChangePassword />
            )}
        </div>
    );
}

function DoctorProfileInfo({ user, updateUser }) {
    const [form, setForm] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phone: user?.phone || "",
        specialization: user?.specialization || "",
        qualification: user?.qualification || "",
        experience: user?.experience || "",
        hospital: user?.hospital || "",
        licenseNumber: user?.licenseNumber || "",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.firstName.trim() || !form.lastName.trim()) {
            setError("First and last name are required"); return;
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
        <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px"
        }}>

            {/* Avatar card */}
            <div style={{
                ...c.card, gridColumn: "1 / -1",
                display: "flex", alignItems: "center",
                gap: "20px", flexWrap: "wrap"
            }}>
                <div style={{
                    width: "72px", height: "72px",
                    borderRadius: "20px",
                    background: "linear-gradient(135deg,#CCFBF1,#EEF2FF)",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "26px",
                    fontWeight: 700, color: "#0F766E", flexShrink: 0,
                }}>
                    {initials}
                </div>
                <div>
                    <p style={{
                        fontSize: "20px", fontWeight: 700,
                        color: "#0F172A", margin: 0
                    }}>
                        Dr. {user?.firstName} {user?.lastName}
                    </p>
                    <p style={{
                        fontSize: "13px", color: "#64748B",
                        margin: "4px 0 0"
                    }}>
                        {user?.specialization || "General Practice"}
                    </p>
                    <p style={{
                        fontSize: "13px", color: "#94A3B8",
                        margin: "3px 0 0"
                    }}>
                        {user?.email}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div style={{ ...c.card, gridColumn: "1 / -1" }}>
                <h3 style={{
                    fontSize: "15px", fontWeight: 600,
                    color: "#0F172A", margin: "0 0 20px"
                }}>
                    Update Professional Information
                </h3>

                {success && <SuccessBox msg="Profile updated successfully" />}
                <ErrorBox msg={error} />

                <form onSubmit={handleSubmit}
                    style={{
                        display: "flex", flexDirection: "column",
                        gap: "14px"
                    }}>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px"
                    }}>
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
                        <input style={{
                            ...c.input, opacity: 0.6,
                            cursor: "not-allowed"
                        }}
                            value={user?.email || ""} disabled />
                    </div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px"
                    }}>
                        <div>
                            <label style={c.label}>Phone</label>
                            <input style={c.input} value={form.phone}
                                placeholder="+92 300 0000000"
                                onChange={(e) => setForm((p) =>
                                    ({ ...p, phone: e.target.value }))} />
                        </div>
                        <div>
                            <label style={c.label}>Specialization</label>
                            <input style={c.input} value={form.specialization}
                                placeholder="e.g. Cardiology"
                                onChange={(e) => setForm((p) =>
                                    ({ ...p, specialization: e.target.value }))} />
                        </div>
                        <div>
                            <label style={c.label}>Qualification</label>
                            <input style={c.input} value={form.qualification}
                                placeholder="e.g. MBBS, MD"
                                onChange={(e) => setForm((p) =>
                                    ({ ...p, qualification: e.target.value }))} />
                        </div>
                        <div>
                            <label style={c.label}>Experience (years)</label>
                            <input style={c.input} value={form.experience}
                                placeholder="e.g. 8"
                                onChange={(e) => setForm((p) =>
                                    ({ ...p, experience: e.target.value }))} />
                        </div>
                        <div>
                            <label style={c.label}>Hospital / Clinic</label>
                            <input style={c.input} value={form.hospital}
                                placeholder="Lifecare Hospital"
                                onChange={(e) => setForm((p) =>
                                    ({ ...p, hospital: e.target.value }))} />
                        </div>
                        <div>
                            <label style={c.label}>License Number</label>
                            <input style={c.input} value={form.licenseNumber}
                                placeholder="PMDC-12345"
                                onChange={(e) => setForm((p) =>
                                    ({ ...p, licenseNumber: e.target.value }))} />
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        style={{
                            ...c.btn, width: "fit-content",
                            padding: "10px 24px",
                            opacity: loading ? 0.7 : 1
                        }}>
                        {loading ? (
                            <>
                                <Loader size={14}
                                    style={{
                                        animation:
                                            "spin 0.8s linear infinite"
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

function DoctorChangePassword() {
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [show, setShow] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.currentPassword) {
            setError("Current password is required"); return;
        }
        if (form.newPassword.length < 6) {
            setError("New password must be at least 6 characters"); return;
        }
        if (form.newPassword !== form.confirmPassword) {
            setError("Passwords do not match"); return;
        }
        setLoading(true);
        setError("");
        try {
            await authAPI.changePassword({
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            setSuccess(true);
            setForm({
                currentPassword: "", newPassword: "",
                confirmPassword: ""
            });
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Password change failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ ...c.card, maxWidth: "480px" }}>
            <div style={{
                display: "flex", alignItems: "center",
                gap: "10px", marginBottom: "20px"
            }}>
                <div style={{
                    width: "36px", height: "36px",
                    borderRadius: "10px", background: "#EEF2FF",
                    display: "flex", alignItems: "center",
                    justifyContent: "center"
                }}>
                    <Lock size={18} color="#6366F1" />
                </div>
                <h3 style={{
                    fontSize: "15px", fontWeight: 600,
                    color: "#0F172A", margin: 0
                }}>
                    Change Password
                </h3>
            </div>

            {success && <SuccessBox msg="Password changed successfully" />}
            <ErrorBox msg={error} />

            <form onSubmit={handleSubmit}
                style={{
                    display: "flex", flexDirection: "column",
                    gap: "14px"
                }}>
                {[
                    { name: "currentPassword", label: "Current Password" },
                    { name: "newPassword", label: "New Password" },
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
                                style={{
                                    position: "absolute", right: "14px",
                                    top: "50%", transform: "translateY(-50%)",
                                    background: "none", border: "none",
                                    cursor: "pointer", color: "#94A3B8"
                                }}>
                                {show[field.name]
                                    ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>
                ))}

                <button type="submit" disabled={loading}
                    style={{
                        ...c.btn, width: "fit-content",
                        padding: "10px 24px",
                        opacity: loading ? 0.7 : 1
                    }}>
                    {loading ? "Updating..." : "Update Password"}
                </button>
            </form>
        </div>
    );
}