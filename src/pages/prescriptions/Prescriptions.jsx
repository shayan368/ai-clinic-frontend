import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { prescriptionAPI, patientAPI, doctorAPI } from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  FileText, Plus, Search, Download,
  Eye, Trash2, Pill, ChevronDown,
  User, Stethoscope, X, GripVertical,
} from "lucide-react";

// ── Status badge ──
const StatusBadge = ({ status }) => {
  const map = {
    active:    "badge-success",
    completed: "badge-muted",
    cancelled: "badge-danger",
  };
  return <span className={map[status] || "badge-muted"}>{status}</span>;
};

// ── Empty state ──
const EmptyState = ({ onAdd, canWrite }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
         style={{ background: "#F0FDFA" }}>
      <FileText size={28} style={{ color: "#0F766E" }} />
    </div>
    <div className="text-center">
      <h3 className="font-semibold text-textPrimary">
        No prescriptions yet
      </h3>
      <p className="text-textSecondary text-sm mt-1">
        {canWrite
          ? "Write your first prescription to get started"
          : "No prescriptions have been issued yet"}
      </p>
    </div>
    {canWrite && (
      <button onClick={onAdd} className="btn-primary !w-auto px-6">
        <Plus size={16} />
        New Prescription
      </button>
    )}
  </div>
);

export default function Prescriptions() {
  const { user, isAdmin, isDoctor } = useAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [filtered,      setFiltered]      = useState([]);
  const [patients,      setPatients]      = useState([]);
  const [doctors,       setDoctors]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [showModal,     setShowModal]     = useState(false);
  const [viewData,      setViewData]      = useState(null);
  const [delId,         setDelId]         = useState(null);
  const [downloading,   setDownloading]   = useState(null);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    let result = [...prescriptions];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        getPatientName(p.patientId).toLowerCase().includes(q) ||
        getDoctorName(p.doctorId).toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    setFiltered(result);
  }, [search, statusFilter, prescriptions, patients, doctors]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [presRes, patRes, docRes] = await Promise.all([
        prescriptionAPI.getAll(),
        patientAPI.getAll(),
        doctorAPI.getAll(),
      ]);
      setPrescriptions(presRes.data.data || []);
      setPatients(patRes.data.data       || []);
      setDoctors(docRes.data.data        || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (id) => {
    const p = patients.find((p) => p.id === id);
    return p ? p.name : `Patient #${id}`;
  };

  const getDoctorName = (id) => {
    const d = doctors.find((d) => d.id === id);
    return d ? `Dr. ${d.firstName} ${d.lastName}` : `Doctor #${id}`;
  };

  const handleDownload = async (id) => {
    setDownloading(id);
    try {
      const res = await prescriptionAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `prescription_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await prescriptionAPI.delete(id);
      setPrescriptions((prev) => prev.filter((p) => p.id !== id));
      setDelId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaved = (prescription) => {
    setPrescriptions((prev) => [prescription, ...prev]);
    setShowModal(false);
  };

  const canWrite = isDoctor;

  // ── Stats ──
  const total     = prescriptions.length;
  const active    = prescriptions.filter((p) => p.status === "active").length;
  const completed = prescriptions.filter((p) => p.status === "completed").length;
  const cancelled = prescriptions.filter((p) => p.status === "cancelled").length;

  // ── Initials ──
  const initials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Prescriptions</h1>
          <p className="page-subtitle">
            {filtered.length} prescription
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary !w-auto px-5"
          >
            <Plus size={16} />
            New Prescription
          </button>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total",     value: total,     color: "#0F766E",
            bg: "#F0FDFA", filter: "all" },
          { label: "Active",    value: active,    color: "#15803D",
            bg: "#DCFCE7", filter: "active" },
          { label: "Completed", value: completed, color: "#475569",
            bg: "#F1F5F9", filter: "completed" },
          { label: "Cancelled", value: cancelled, color: "#DC2626",
            bg: "#FEE2E2", filter: "cancelled" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(s.filter)}
            className="card !p-4 flex items-center gap-4 text-left
                       transition-all duration-200 hover:shadow-cardHover
                       hover:-translate-y-0.5 w-full"
            style={
              statusFilter === s.filter
                ? { borderColor: s.color,
                    boxShadow: `0 0 0 2px ${s.color}30` }
                : {}
            }
          >
            <div className="w-10 h-10 rounded-xl flex items-center
                            justify-center flex-shrink-0"
                 style={{ background: s.bg }}>
              <FileText size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-textPrimary">
                {s.value}
              </p>
              <p className="text-xs text-textSecondary">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Search & filter ── */}
      <div className="card !p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 rounded-xl
                        px-4 py-2.5"
             style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <Search size={15} className="text-textMuted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by patient or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-textPrimary
                       placeholder-textMuted outline-none w-full"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-textMuted hover:text-textSecondary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none text-sm rounded-xl px-4 py-2.5
                       pr-9 outline-none cursor-pointer text-textSecondary"
            style={{
              background: "#F8FAFC",
              border:     "1px solid #E2E8F0",
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-textMuted pointer-events-none"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col gap-3 p-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}
                   className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full"
                     style={{ background: "#E2E8F0" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded w-1/3"
                       style={{ background: "#E2E8F0" }} />
                  <div className="h-3 rounded w-1/4"
                       style={{ background: "#E2E8F0" }} />
                </div>
                <div className="h-6 rounded w-20"
                     style={{ background: "#E2E8F0" }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            onAdd={() => setShowModal(true)}
            canWrite={canWrite}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <th className="table-header">Patient</th>
                  <th className="table-header">Doctor</th>
                  <th className="table-header hidden md:table-cell">
                    Medicines
                  </th>
                  <th className="table-header hidden lg:table-cell">
                    Date
                  </th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pres) => {
                  const patientName = getPatientName(pres.patientId);
                  const doctorName  = getDoctorName(pres.doctorId);
                  const medicines   = Array.isArray(pres.medicines)
                    ? pres.medicines
                    : [];

                  return (
                    <tr key={pres.id} className="table-row">

                      {/* Patient */}
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center
                                       justify-center flex-shrink-0 text-xs
                                       font-bold"
                            style={{
                              background: "#CCFBF1",
                              color:      "#0F766E",
                            }}
                          >
                            {initials(patientName)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-textPrimary">
                              {patientName}
                            </p>
                            <p className="text-xs text-textMuted">
                              ID #{pres.patientId}
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
                            style={{ background: "#EEF2FF" }}
                          >
                            <Stethoscope
                              size={13}
                              style={{ color: "#6366F1" }}
                            />
                          </div>
                          <span className="text-sm text-textPrimary">
                            {doctorName}
                          </span>
                        </div>
                      </td>

                      {/* Medicines */}
                      <td className="table-cell hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {medicines.slice(0, 2).map((m, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1
                                         px-2 py-0.5 rounded-lg text-xs
                                         font-medium"
                              style={{
                                background: "#F0FDFA",
                                color:      "#0F766E",
                              }}
                            >
                              <Pill size={10} />
                              {m.name}
                            </span>
                          ))}
                          {medicines.length > 2 && (
                            <span
                              className="inline-flex items-center px-2
                                         py-0.5 rounded-lg text-xs"
                              style={{
                                background: "#F1F5F9",
                                color:      "#475569",
                              }}
                            >
                              +{medicines.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="table-cell hidden lg:table-cell">
                        {new Date(pres.createdAt).toLocaleDateString(
                          "en-PK",
                          {
                            day:   "numeric",
                            month: "short",
                            year:  "numeric",
                          }
                        )}
                      </td>

                      {/* Status */}
                      <td className="table-cell">
                        <StatusBadge status={pres.status} />
                      </td>

                      {/* Actions */}
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">

                          {/* View */}
                          <button
                            onClick={() => setViewData(pres)}
                            className="w-8 h-8 flex items-center
                                       justify-center rounded-lg
                                       transition-colors"
                            style={{
                              background: "#F1F5F9",
                              color:      "#475569",
                            }}
                            title="View"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Download */}
                          <button
                            onClick={() => handleDownload(pres.id)}
                            disabled={downloading === pres.id}
                            className="w-8 h-8 flex items-center
                                       justify-center rounded-lg
                                       transition-colors"
                            style={{
                              background: "#EEF2FF",
                              color:      "#6366F1",
                            }}
                            title="Download PDF"
                          >
                            {downloading === pres.id ? (
                              <span className="w-3.5 h-3.5 border-2
                                               border-t-transparent
                                               rounded-full animate-spin"
                                    style={{ borderColor: "#6366F1",
                                             borderTopColor: "transparent" }}
                              />
                            ) : (
                              <Download size={14} />
                            )}
                          </button>

                          {/* Delete */}
                          {(isAdmin || isDoctor) && (
                            <button
                              onClick={() => setDelId(pres.id)}
                              className="w-8 h-8 flex items-center
                                         justify-center rounded-lg
                                         transition-colors"
                              style={{
                                background: "#FEE2E2",
                                color:      "#DC2626",
                              }}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
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

      {/* ── Create Modal ── */}
      {showModal && (
        <PrescriptionModal
          patients={patients}
          doctors={doctors}
          currentUser={user}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {/* ── View Modal ── */}
      {viewData && (
        <ViewPrescriptionModal
          prescription={viewData}
          patientName={getPatientName(viewData.patientId)}
          doctorName={getDoctorName(viewData.doctorId)}
          onClose={() => setViewData(null)}
          onDownload={handleDownload}
          downloading={downloading}
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
// CREATE PRESCRIPTION MODAL
// ─────────────────────────────────────────────
function PrescriptionModal({ patients, doctors, currentUser,
                             onClose, onSaved }) {
  const [form, setForm] = useState({
    patientId:    "",
    doctorId:     currentUser?.role === "doctor" ? currentUser.id : "",
    instructions: "",
    status:       "active",
  });

  const [medicines, setMedicines] = useState([
    { name: "", dosage: "", frequency: "", duration: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleFormChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMedChange = (index, field, value) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const addMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      { name: "", dosage: "", frequency: "", duration: "" },
    ]);
  };

  const removeMedicine = (index) => {
    if (medicines.length === 1) return;
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patientId || !form.doctorId) {
      setError("Patient and doctor are required");
      return;
    }

    const validMeds = medicines.filter((m) => m.name.trim());
    if (validMeds.length === 0) {
      setError("At least one medicine is required");
      return;
    }

    setLoading(true);
    try {
      const res = await prescriptionAPI.create({
        ...form,
        patientId: form.patientId,
        doctorId:  form.doctorId,
        medicines:  validMeds,
      });
      onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center
                    justify-center p-4 overflow-y-auto"
         style={{ background: "rgba(15,23,42,0.5)",
                  backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-2xl card my-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-textPrimary">
              New Prescription
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              Fill in the details below to create a prescription
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center
                       rounded-lg text-textMuted hover:text-textPrimary
                       hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm
                          flex items-center gap-2"
               style={{ background: "#FEE2E2",
                        border: "1px solid #FECACA",
                        color: "#DC2626" }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "#DC2626" }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Patient + Doctor row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-textSecondary">
                Patient <span style={{ color: "#EF4444" }}>*</span>
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
                  onChange={handleFormChange}
                  className="input !pl-9"
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-textSecondary">
                Doctor <span style={{ color: "#EF4444" }}>*</span>
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
                  onChange={handleFormChange}
                  className="input !pl-9"
                  disabled={currentUser?.role === "doctor"}
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Medicines builder */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-textSecondary">
                Medicines <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <button
                type="button"
                onClick={addMedicine}
                className="flex items-center gap-1.5 text-xs font-medium
                           px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: "#F0FDFA", color: "#0F766E" }}
              >
                <Plus size={12} />
                Add Medicine
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {medicines.map((med, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl flex flex-col gap-3"
                  style={{ background: "#F8FAFC",
                           border: "1px solid #E2E8F0" }}
                >
                  {/* Medicine header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center
                                      justify-center"
                           style={{ background: "#CCFBF1" }}>
                        <Pill size={12} style={{ color: "#0F766E" }} />
                      </div>
                      <span className="text-xs font-semibold text-textSecondary">
                        Medicine {index + 1}
                      </span>
                    </div>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(index)}
                        className="w-6 h-6 flex items-center justify-center
                                   rounded-md transition-colors"
                        style={{ color: "#94A3B8" }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Medicine fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 sm:col-span-1">
                      <input
                        type="text"
                        placeholder="Medicine name *"
                        value={med.name}
                        onChange={(e) =>
                          handleMedChange(index, "name", e.target.value)
                        }
                        className="input !py-2 text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 5mg)"
                        value={med.dosage}
                        onChange={(e) =>
                          handleMedChange(index, "dosage", e.target.value)
                        }
                        className="input !py-2 text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Frequency (e.g. Twice daily)"
                        value={med.frequency}
                        onChange={(e) =>
                          handleMedChange(index, "frequency", e.target.value)
                        }
                        className="input !py-2 text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Duration (e.g. 7 days)"
                        value={med.duration}
                        onChange={(e) =>
                          handleMedChange(index, "duration", e.target.value)
                        }
                        className="input !py-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Instructions
            </label>
            <textarea
              name="instructions"
              value={form.instructions}
              onChange={handleFormChange}
              placeholder="Special instructions, dietary advice, follow-up notes..."
              rows={3}
              className="input resize-none"
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
              onChange={handleFormChange}
              className="input"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2"
               style={{ borderTop: "1px solid #E2E8F0" }}>
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
                  <span className="w-4 h-4 border-2 border-white/40
                                   border-t-white rounded-full
                                   animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Prescription"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// VIEW PRESCRIPTION MODAL
// ─────────────────────────────────────────────
function ViewPrescriptionModal({ prescription, patientName, doctorName,
                                 onClose, onDownload, downloading }) {
  const medicines = Array.isArray(prescription.medicines)
    ? prescription.medicines
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center
                    justify-center p-4"
         style={{ background: "rgba(15,23,42,0.5)",
                  backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg card max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center
                              justify-center"
                   style={{ background: "#EEF2FF" }}>
                <FileText size={16} style={{ color: "#6366F1" }} />
              </div>
              <h2 className="text-lg font-bold text-textPrimary">
                Prescription #{prescription.id}
              </h2>
            </div>
            <p className="text-xs text-textMuted ml-10">
              {new Date(prescription.createdAt).toLocaleDateString("en-PK", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center
                       rounded-lg text-textMuted hover:bg-muted
                       transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Patient + Doctor */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl"
               style={{ background: "#F0FDFA",
                        border: "1px solid #CCFBF1" }}>
            <p className="text-xs text-textMuted mb-1">Patient</p>
            <p className="text-sm font-semibold text-textPrimary">
              {patientName}
            </p>
          </div>
          <div className="p-3 rounded-xl"
               style={{ background: "#EEF2FF",
                        border: "1px solid #C7D2FE" }}>
            <p className="text-xs text-textMuted mb-1">Doctor</p>
            <p className="text-sm font-semibold text-textPrimary">
              {doctorName}
            </p>
          </div>
        </div>

        {/* Medicines */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-textMuted uppercase
                        tracking-wide mb-3">
            Medicines ({medicines.length})
          </p>
          <div className="flex flex-col gap-2">
            {medicines.map((med, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "#F8FAFC",
                         border: "1px solid #E2E8F0" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center
                                justify-center flex-shrink-0"
                     style={{ background: "#CCFBF1" }}>
                  <Pill size={14} style={{ color: "#0F766E" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-textPrimary">
                    {med.name}
                    {med.dosage && (
                      <span className="text-xs font-normal
                                       text-textMuted ml-2">
                        {med.dosage}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-textMuted mt-0.5">
                    {[med.frequency, med.duration]
                      .filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {prescription.instructions && (
          <div className="mb-5 p-4 rounded-xl"
               style={{ background: "#FFFBEB",
                        border: "1px solid #FDE68A" }}>
            <p className="text-xs font-semibold text-textMuted
                          uppercase tracking-wide mb-2">
              Instructions
            </p>
            <p className="text-sm text-textSecondary leading-relaxed">
              {prescription.instructions}
            </p>
          </div>
        )}

        {/* AI Explanation */}
        {prescription.aiExplanation && (
          <div className="mb-5 p-4 rounded-xl"
               style={{ background: "#EEF2FF",
                        border: "1px solid #C7D2FE" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2"
               style={{ color: "#6366F1" }}>
              ✨ AI Explanation
            </p>
            <p className="text-sm text-textSecondary leading-relaxed
                          whitespace-pre-line">
              {prescription.aiExplanation}
            </p>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-textSecondary">Status</span>
          <StatusBadge status={prescription.status} />
        </div>

        {/* Actions */}
        <div className="flex gap-3"
             style={{ borderTop: "1px solid #E2E8F0",
                      paddingTop: "1.25rem" }}>
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Close
          </button>
          <button
            onClick={() => onDownload(prescription.id)}
            disabled={downloading === prescription.id}
            className="btn-primary flex-1"
          >
            {downloading === prescription.id ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40
                                 border-t-white rounded-full animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={15} />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONFIRM DELETE
// ─────────────────────────────────────────────
function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center
                    justify-center p-4"
         style={{ background: "rgba(15,23,42,0.5)",
                  backdropFilter: "blur(4px)" }}>
      <div className="card w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center
                        justify-center mx-auto mb-4"
             style={{ background: "#FEE2E2" }}>
          <Trash2 size={24} style={{ color: "#DC2626" }} />
        </div>
        <h3 className="text-lg font-bold text-textPrimary">
          Delete Prescription?
        </h3>
        <p className="text-textSecondary text-sm mt-2 mb-6">
          This will permanently delete this prescription record.
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