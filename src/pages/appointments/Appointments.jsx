import { useState, useEffect } from "react";
import { appointmentAPI, patientAPI, doctorAPI } from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  CalendarDays, Plus, Search, Filter,
  Clock, CheckCircle2, XCircle, Pencil,
  Trash2, User, Stethoscope, ChevronDown,
} from "lucide-react";

// ── Status badge ──
const StatusBadge = ({ status }) => {
  const map = {
    confirmed: "badge-success",
    pending:   "badge-warning",
    completed: "badge-muted",
  };
  return (
    <span className={map[status] || "badge-muted"}>
      {status}
    </span>
  );
};

// ── Status icon ──
const StatusIcon = ({ status }) => {
  if (status === "confirmed")
    return <CheckCircle2 size={14} style={{ color: "#22C55E" }} />;
  if (status === "completed")
    return <CheckCircle2 size={14} style={{ color: "#64748B" }} />;
  return <Clock size={14} style={{ color: "#F59E0B" }} />;
};

// ── Empty state ──
const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
         style={{ background: "rgba(15,118,110,0.1)" }}>
      <CalendarDays size={28} style={{ color: "#14B8A6" }} />
    </div>
    <div className="text-center">
      <h3 className="font-semibold text-textPrimary">No appointments yet</h3>
      <p className="text-textSecondary text-sm mt-1">
        Book your first appointment to get started
      </p>
    </div>
    <button onClick={onAdd} className="btn-primary !w-auto px-6">
      <Plus size={16} />
      Book Appointment
    </button>
  </div>
);

export default function Appointments() {
  const { user, isAdmin, isDoctor, isReceptionist } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [patients,     setPatients]     = useState([]);
  const [doctors,      setDoctors]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal,    setShowModal]    = useState(false);
  const [editData,     setEditData]     = useState(null);
  const [delId,        setDelId]        = useState(null);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    let result = [...appointments];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        getPatientName(a.patientId).toLowerCase().includes(q) ||
        getDoctorName(a.doctorId).toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    setFiltered(result);
  }, [search, statusFilter, appointments, patients, doctors]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Fetch appointments based on role
      let apptRes;
      if (isDoctor) {
        apptRes = await appointmentAPI.getByDoctor(user.id);
      } else {
        apptRes = await appointmentAPI.getAll();
      }

      const [patRes, docRes] = await Promise.all([
        patientAPI.getAll(),
        doctorAPI.getAll(),
      ]);

      setAppointments(apptRes.data.data || []);
      setPatients(patRes.data.data     || []);
      setDoctors(docRes.data.data      || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers to get names ──
  const getPatientName = (id) => {
    const p = patients.find((p) => p.id === id);
    return p ? p.name : `Patient #${id}`;
  };

  const getDoctorName = (id) => {
    const d = doctors.find((d) => d.id === id);
    return d ? `Dr. ${d.firstName} ${d.lastName}` : `Doctor #${id}`;
  };

  const getDoctorSpec = (id) => {
    const d = doctors.find((d) => d.id === id);
    return d?.specialization || "General";
  };

  // ── Quick status update ──
  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentAPI.update(id, { status });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await appointmentAPI.delete(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setDelId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaved = (appt, isEdit) => {
    if (isEdit) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? appt : a))
      );
    } else {
      setAppointments((prev) => [appt, ...prev]);
    }
    setShowModal(false);
    setEditData(null);
  };

  const canWrite = isAdmin || isReceptionist;

  // ── Stats ──
  const total     = appointments.length;
  const pending   = appointments.filter((a) => a.status === "pending").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const completed = appointments.filter((a) => a.status === "completed").length;

  // ── Avatar initials from name ──
  const initials = (name) => {
    if (!name) return "?";
    const p = name.trim().split(" ");
    return p.length >= 2
      ? `${p[0][0]}${p[1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">
            {filtered.length} appointment{filtered.length !== 1 ? "s" : ""}
            {statusFilter !== "all" ? ` · ${statusFilter}` : ""}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => { setEditData(null); setShowModal(true); }}
            className="btn-primary !w-auto px-5"
          >
            <Plus size={16} />
            Book Appointment
          </button>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total",
            value: total,
            icon: CalendarDays,
            color: "#14B8A6",
            filter: "all",
          },
          {
            label: "Pending",
            value: pending,
            icon: Clock,
            color: "#F59E0B",
            filter: "pending",
          },
          {
            label: "Confirmed",
            value: confirmed,
            icon: CheckCircle2,
            color: "#22C55E",
            filter: "confirmed",
          },
          {
            label: "Completed",
            value: completed,
            icon: CheckCircle2,
            color: "#64748B",
            filter: "completed",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={() => setStatusFilter(stat.filter)}
              className="card !p-4 flex items-center gap-4 text-left
                         transition-all duration-200 hover:scale-[1.02]
                         w-full"
              style={
                statusFilter === stat.filter
                  ? { borderColor: stat.color,
                      boxShadow: `0 0 0 1px ${stat.color}` }
                  : {}
              }
            >
              <div className="w-10 h-10 rounded-xl flex items-center
                              justify-center flex-shrink-0"
                   style={{ background: stat.color + "20" }}>
                <Icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-textPrimary">
                  {stat.value}
                </p>
                <p className="text-xs text-textSecondary">{stat.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Search & filter bar ── */}
      <div className="card !p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 flex items-center gap-3 bg-surface
                        border border-border rounded-xl px-4 py-2.5">
          <Search size={15} className="text-textMuted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by patient or doctor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-textPrimary
                       placeholder-textMuted outline-none w-full"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-textMuted hover:text-textSecondary text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status filter dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-surface border border-border
                       text-textSecondary text-sm rounded-xl px-4 py-2.5
                       pr-9 outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-textMuted pointer-events-none"
          />
        </div>
      </div>

      {/* ── Appointments table ── */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col gap-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i}
                   className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 bg-border rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-border rounded w-1/3" />
                  <div className="h-3 bg-border rounded w-1/4" />
                </div>
                <div className="h-6 bg-border rounded w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            onAdd={() => { setEditData(null); setShowModal(true); }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #1E293B" }}>
                  <th className="table-header">Patient</th>
                  <th className="table-header">Doctor</th>
                  <th className="table-header hidden md:table-cell">
                    Date & Time
                  </th>
                  <th className="table-header">Status</th>
                  <th className="table-header hidden lg:table-cell">
                    Quick Update
                  </th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt) => {
                  const patientName = getPatientName(appt.patientId);
                  const doctorName  = getDoctorName(appt.doctorId);
                  const doctorSpec  = getDoctorSpec(appt.doctorId);
                  const apptDate    = new Date(appt.date);

                  return (
                    <tr key={appt.id} className="table-row">

                      {/* Patient */}
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center
                                       justify-center flex-shrink-0 text-xs
                                       font-bold"
                            style={{
                              background: "rgba(20,184,166,0.15)",
                              color:      "#14B8A6",
                            }}
                          >
                            {initials(patientName)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-textPrimary">
                              {patientName}
                            </p>
                            <p className="text-xs text-textMuted">
                              ID #{appt.patientId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center
                                       justify-center flex-shrink-0"
                            style={{ background: "rgba(99,102,241,0.15)" }}
                          >
                            <Stethoscope
                              size={13}
                              style={{ color: "#6366F1" }}
                            />
                          </div>
                          <div>
                            <p className="text-sm text-textPrimary">
                              {doctorName}
                            </p>
                            <p className="text-xs text-textMuted">
                              {doctorSpec}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="table-cell hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm text-textPrimary font-medium">
                            {apptDate.toLocaleDateString("en-PK", {
                              day:   "numeric",
                              month: "short",
                              year:  "numeric",
                            })}
                          </p>
                          <p className="text-xs text-textMuted">
                            {apptDate.toLocaleTimeString("en-PK", {
                              hour:   "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon status={appt.status} />
                          <StatusBadge status={appt.status} />
                        </div>
                      </td>

                      {/* Quick update buttons */}
                      <td className="table-cell hidden lg:table-cell">
                        <div className="flex gap-1.5">
                          {appt.status === "pending" && (
                            <button
                              onClick={() =>
                                handleStatusUpdate(appt.id, "confirmed")
                              }
                              className="text-xs px-2.5 py-1 rounded-lg
                                         font-medium transition-colors"
                              style={{
                                background: "rgba(34,197,94,0.1)",
                                color:      "#22C55E",
                              }}
                            >
                              Confirm
                            </button>
                          )}
                          {appt.status === "confirmed" && (
                            <button
                              onClick={() =>
                                handleStatusUpdate(appt.id, "completed")
                              }
                              className="text-xs px-2.5 py-1 rounded-lg
                                         font-medium transition-colors"
                              style={{
                                background: "rgba(99,102,241,0.1)",
                                color:      "#6366F1",
                              }}
                            >
                              Complete
                            </button>
                          )}
                          {appt.status === "completed" && (
                            <span className="text-xs text-textMuted">
                              Done
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canWrite && (
                            <>
                              <button
                                onClick={() => {
                                  setEditData(appt);
                                  setShowModal(true);
                                }}
                                className="w-8 h-8 flex items-center
                                           justify-center rounded-lg
                                           transition-colors"
                                style={{
                                  background: "rgba(20,184,166,0.1)",
                                  color:      "#14B8A6",
                                }}
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() => setDelId(appt.id)}
                                  className="w-8 h-8 flex items-center
                                             justify-center rounded-lg
                                             transition-colors"
                                  style={{
                                    background: "rgba(239,68,68,0.1)",
                                    color:      "#EF4444",
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Book / Edit Modal ── */}
      {showModal && (
        <AppointmentModal
          editData={editData}
          patients={patients}
          doctors={doctors}
          onClose={() => { setShowModal(false); setEditData(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* ── Delete confirm ── */}
      {delId && (
        <ConfirmDelete
          onConfirm={() => handleDelete(delId)}
          onCancel={() => setDelId(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// APPOINTMENT MODAL — Book / Edit
// ─────────────────────────────────────────────
function AppointmentModal({ editData, patients, doctors, onClose, onSaved }) {
  const isEdit = Boolean(editData);

  const [form,    setForm]    = useState({
    patientId: editData?.patientId || "",
    doctorId:  editData?.doctorId  || "",
    date:      editData?.date
      ? new Date(editData.date).toISOString().slice(0, 16)
      : "",
    status:    editData?.status    || "pending",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patientId || !form.doctorId || !form.date) {
      setError("Patient, doctor and date are all required");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await appointmentAPI.update(editData.id, {
          ...form,
          patientId: form.patientId,
          doctorId:  form.doctorId,
        });
      } else {
        res = await appointmentAPI.create({
          ...form,
          patientId: form.patientId,
          doctorId:  form.doctorId,
        });
      }
      onSaved(res.data.data, isEdit);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background:     "rgba(2,6,23,0.85)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="w-full max-w-md card">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-textPrimary">
              {isEdit ? "Edit Appointment" : "Book Appointment"}
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              {isEdit
                ? "Update appointment details"
                : "Schedule a new appointment"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       text-textMuted hover:text-textPrimary transition-colors"
            style={{ background: "rgba(51,65,85,0.3)" }}
          >
            ✕
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-danger text-sm
                       flex items-center gap-2"
            style={{
              background: "rgba(239,68,68,0.1)",
              border:     "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-danger
                             flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Patient select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Patient <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <User
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2
                           text-textMuted pointer-events-none"
              />
              <select
                name="patientId"
                value={form.patientId}
                onChange={handleChange}
                className="input !pl-9"
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctor select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Doctor <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Stethoscope
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2
                           text-textMuted pointer-events-none"
              />
              <select
                name="doctorId"
                value={form.doctorId}
                onChange={handleChange}
                className="input !pl-9"
              >
                <option value="">Select doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.firstName} {d.lastName}
                    {d.specialization ? ` — ${d.specialization}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Date & Time <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="input"
              style={{ colorScheme: "dark" }}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="input"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30
                                   border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? "Save changes" : "Book appointment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONFIRM DELETE
// ─────────────────────────────────────────────
function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background:     "rgba(2,6,23,0.85)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="card w-full max-w-sm text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center
                     mx-auto mb-4"
          style={{ background: "rgba(239,68,68,0.1)" }}
        >
          <Trash2 size={24} className="text-danger" />
        </div>
        <h3 className="text-lg font-bold text-textPrimary">
          Delete Appointment?
        </h3>
        <p className="text-textSecondary text-sm mt-2 mb-6">
          This will permanently delete this appointment.
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger flex-1">
            Yes, delete
          </button>
        </div>
      </div>
    </div>
  );
}