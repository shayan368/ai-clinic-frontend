import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  patientAPI,
  appointmentAPI,
  prescriptionAPI,
  aiAPI,
} from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  ArrowLeft, Phone, Mail, MapPin, Droplets,
  Calendar, FileText, Brain, Clock,
  CheckCircle2, AlertCircle, User,
  Activity, Pencil, Trash2,
} from "lucide-react";

// ── Timeline entry ──
const TimelineItem = ({ icon: Icon, title, subtitle, time, color, last }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
           style={{ background: color + "20" }}>
        <Icon size={16} style={{ color }} />
      </div>
      {!last && <div className="w-px flex-1 bg-border mt-2 mb-0" />}
    </div>
    <div className={`pb-6 min-w-0 flex-1 ${last ? "" : ""}`}>
      <p className="text-sm font-medium text-textPrimary">{title}</p>
      {subtitle && (
        <p className="text-xs text-textMuted mt-0.5">{subtitle}</p>
      )}
      <p className="text-xs mt-1" style={{ color: "#64748B" }}>{time}</p>
    </div>
  </div>
);

// ── Stat card ──
const InfoCard = ({ icon: Icon, label, value, color }) => (
  <div className="card !p-4 flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center
                    flex-shrink-0"
         style={{ background: color + "20" }}>
      <Icon size={18} style={{ color }} />
    </div>
    <div>
      <p className="text-xs text-textMuted">{label}</p>
      <p className="text-sm font-semibold text-textPrimary mt-0.5">{value}</p>
    </div>
  </div>
);

export default function PatientProfile() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { isAdmin, isReceptionist, isDoctor } = useAuth();

  const [patient,       setPatient]       = useState(null);
  const [appointments,  setAppointments]  = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [diagnosisLogs, setDiagnosisLogs] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("overview");
  const [showEdit,      setShowEdit]      = useState(false);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, aRes, prRes, dRes] = await Promise.all([
        patientAPI.getOne(id),
        appointmentAPI.getByPatient(id),
        prescriptionAPI.getByPatient(id),
        aiAPI.getLogsByPatient(id),
      ]);
      setPatient(pRes.data.data);
      setAppointments(aRes.data.data  || []);
      setPrescriptions(prRes.data.data || []);
      setDiagnosisLogs(dRes.data.data  || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (prescriptionId) => {
    try {
      const res = await prescriptionAPI.download(prescriptionId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `prescription_${prescriptionId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-card rounded-xl" />
        <div className="h-40 bg-card rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-card rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={40} className="text-danger" />
        <p className="text-textSecondary">Patient not found</p>
        <Link to="/app/patients" className="btn-primary !w-auto px-6">
          Back to patients
        </Link>
      </div>
    );
  }

  // Build timeline from all records
  const timeline = [
    ...appointments.map((a) => ({
      id:       `a-${a.id}`,
      type:     "appointment",
      icon:     Calendar,
      color:    "#14B8A6",
      title:    `Appointment — ${a.status}`,
      subtitle: `Doctor #${a.doctorId}`,
      time:     new Date(a.date).toLocaleDateString("en-PK", {
        year: "numeric", month: "short", day: "numeric",
      }),
      date: new Date(a.date),
    })),
    ...prescriptions.map((p) => ({
      id:       `p-${p.id}`,
      type:     "prescription",
      icon:     FileText,
      color:    "#6366F1",
      title:    `Prescription — ${p.medicines?.length || 0} medicine(s)`,
      subtitle: p.instructions || "Follow doctor's advice",
      time:     new Date(p.createdAt).toLocaleDateString("en-PK", {
        year: "numeric", month: "short", day: "numeric",
      }),
      date: new Date(p.createdAt),
    })),
    ...diagnosisLogs.map((d) => ({
      id:       `d-${d.id}`,
      type:     "diagnosis",
      icon:     Brain,
      color:    "#A855F7",
      title:    `AI Diagnosis — Risk: ${d.riskLevel}`,
      subtitle: d.symptoms?.substring(0, 60) + "...",
      time:     new Date(d.createdAt).toLocaleDateString("en-PK", {
        year: "numeric", month: "short", day: "numeric",
      }),
      date: new Date(d.createdAt),
    })),
  ].sort((a, b) => b.date - a.date);

  const TABS = [
    { key: "overview",      label: "Overview"      },
    { key: "appointments",  label: `Appointments (${appointments.length})`  },
    { key: "prescriptions", label: `Prescriptions (${prescriptions.length})` },
    { key: "timeline",      label: "Timeline"      },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* ── Back button ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/app/patients")}
          className="btn-ghost !w-auto gap-2 !py-2 !px-3"
        >
          <ArrowLeft size={16} />
          Patients
        </button>
      </div>

      {/* ── Profile card ── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-6">

          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center
                          flex-shrink-0 text-2xl font-bold"
               style={{
                 background: "linear-gradient(135deg,#0F766E30,#6366F130)",
                 color: "#14B8A6",
               }}>
            {patient.name?.[0]?.toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start
                            sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-textPrimary">
                  {patient.name}
                </h2>
                <p className="text-textSecondary text-sm mt-1">
                  Patient ID #{patient.id} ·{" "}
                  {patient.age ? `${patient.age} years old` : "Age unknown"} ·{" "}
                  <span className="capitalize">{patient.gender || "Unknown"}</span>
                </p>
              </div>

              {(isAdmin || isReceptionist) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEdit(true)}
                    className="btn-secondary !w-auto gap-2 text-sm"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Contact info row */}
            <div className="flex flex-wrap gap-4 mt-4">
              {patient.contact && (
                <div className="flex items-center gap-1.5 text-sm
                                text-textSecondary">
                  <Phone size={13} style={{ color: "#14B8A6" }} />
                  {patient.contact}
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-1.5 text-sm
                                text-textSecondary">
                  <Mail size={13} style={{ color: "#6366F1" }} />
                  {patient.email}
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-1.5 text-sm
                                text-textSecondary">
                  <MapPin size={13} style={{ color: "#A855F7" }} />
                  {patient.address}
                </div>
              )}
              {patient.bloodGroup && (
                <div className="flex items-center gap-1.5 text-sm font-bold
                                text-danger">
                  <Droplets size={13} />
                  {patient.bloodGroup}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          icon={Calendar}
          label="Total Appointments"
          value={appointments.length}
          color="#14B8A6"
        />
        <InfoCard
          icon={FileText}
          label="Prescriptions"
          value={prescriptions.length}
          color="#6366F1"
        />
        <InfoCard
          icon={Brain}
          label="AI Diagnoses"
          value={diagnosisLogs.length}
          color="#A855F7"
        />
        <InfoCard
          icon={CheckCircle2}
          label="Completed Visits"
          value={appointments.filter((a) => a.status === "completed").length}
          color="#22C55E"
        />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
           style={{ background: "#0F172A", border: "1px solid #1E293B" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium
                       transition-all duration-200"
            style={
              activeTab === tab.key
                ? {
                    background: "linear-gradient(135deg,#0F766E,#6366F1)",
                    color: "#fff",
                  }
                : { color: "#94A3B8" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Medical history */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} style={{ color: "#14B8A6" }} />
              <h3 className="font-semibold text-textPrimary">
                Medical History
              </h3>
            </div>
            <p className="text-sm text-textSecondary leading-relaxed">
              {patient.history || "No medical history recorded."}
            </p>
          </div>

          {/* Recent activity */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} style={{ color: "#6366F1" }} />
              <h3 className="font-semibold text-textPrimary">
                Recent Activity
              </h3>
            </div>
            {timeline.length === 0 ? (
              <p className="text-sm text-textMuted">No activity yet.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {timeline.slice(0, 4).map((item, idx) => (
                  <TimelineItem
                    key={item.id}
                    {...item}
                    last={idx === Math.min(3, timeline.length - 1)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointments tab */}
      {activeTab === "appointments" && (
        <div className="card !p-0 overflow-hidden">
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Calendar size={32} className="text-textMuted" />
              <p className="text-textSecondary text-sm">
                No appointments found
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #1E293B" }}>
                  <th className="table-header">Date</th>
                  <th className="table-header">Doctor</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="table-row">
                    <td className="table-cell text-textPrimary">
                      {new Date(appt.date).toLocaleDateString("en-PK", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                    <td className="table-cell">
                      Dr. #{appt.doctorId}
                    </td>
                    <td className="table-cell">
                      <span className={
                        appt.status === "completed" ? "badge-muted"
                        : appt.status === "confirmed" ? "badge-success"
                        : "badge-warning"
                      }>
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Prescriptions tab */}
      {activeTab === "prescriptions" && (
        <div className="flex flex-col gap-4">
          {prescriptions.length === 0 ? (
            <div className="card flex flex-col items-center justify-center
                            py-16 gap-3">
              <FileText size={32} className="text-textMuted" />
              <p className="text-textSecondary text-sm">
                No prescriptions found
              </p>
            </div>
          ) : (
            prescriptions.map((p) => (
              <div key={p.id} className="card">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-textPrimary">
                      Prescription #{p.id}
                    </p>
                    <p className="text-xs text-textMuted mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString("en-PK", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                      {" · "}Doctor #{p.doctorId}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={
                      p.status === "active" ? "badge-success"
                      : p.status === "completed" ? "badge-muted"
                      : "badge-danger"
                    }>
                      {p.status}
                    </span>
                    <button
                      onClick={() => handleDownload(p.id)}
                      className="btn-secondary !w-auto !py-1 !px-3 text-xs"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>

                {/* Medicines list */}
                <div className="flex flex-col gap-2">
                  {(Array.isArray(p.medicines) ? p.medicines : []).map(
                    (med, i) => (
                      <div key={i}
                           className="flex items-center gap-3 px-3 py-2
                                      rounded-lg"
                           style={{ background: "rgba(99,102,241,0.06)" }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: "#6366F1" }} />
                        <span className="text-sm text-textPrimary font-medium">
                          {med.name}
                        </span>
                        <span className="text-xs text-textMuted ml-auto">
                          {med.dosage} · {med.frequency} · {med.duration}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {p.instructions && (
                  <p className="text-xs text-textSecondary mt-3 pt-3
                                border-t border-border">
                    {p.instructions}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Timeline tab */}
      {activeTab === "timeline" && (
        <div className="card">
          <h3 className="font-semibold text-textPrimary mb-6">
            Complete Medical Timeline
          </h3>
          {timeline.length === 0 ? (
            <p className="text-textMuted text-sm">No records yet.</p>
          ) : (
            <div className="flex flex-col">
              {timeline.map((item, idx) => (
                <TimelineItem
                  key={item.id}
                  {...item}
                  last={idx === timeline.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}