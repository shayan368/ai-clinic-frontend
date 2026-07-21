import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { patientAPI } from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  Users, Plus, Search, Filter,
  Eye, Pencil, Trash2, Phone,
  User, ChevronRight,
} from "lucide-react";

// ── Gender badge ──
const GenderBadge = ({ gender }) => {
  if (!gender) return <span className="badge-muted">—</span>;
  const map = {
    male:   "badge-primary",
    female: "badge-ai",
    other:  "badge-muted",
  };
  return <span className={map[gender] || "badge-muted"}>{gender}</span>;
};

// ── Blood group badge ──
const BloodBadge = ({ blood }) => {
  if (!blood) return <span className="text-textMuted text-xs">—</span>;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md
                     text-xs font-bold text-danger"
          style={{ background: "rgba(239,68,68,0.1)" }}>
      {blood}
    </span>
  );
};

// ── Empty state ──
const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
         style={{ background: "rgba(15,118,110,0.1)" }}>
      <Users size={28} style={{ color: "#14B8A6" }} />
    </div>
    <div className="text-center">
      <h3 className="font-semibold text-textPrimary">No patients yet</h3>
      <p className="text-textSecondary text-sm mt-1">
        Register your first patient to get started
      </p>
    </div>
    <button onClick={onAdd} className="btn-primary !w-auto px-6">
      <Plus size={16} />
      Add Patient
    </button>
  </div>
);

export default function Patients() {
  const { isAdmin, isDoctor, isReceptionist } = useAuth();

  const [patients,  setPatients]  = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData,  setEditData]  = useState(null);
  const [delId,     setDelId]     = useState(null);

  useEffect(() => { fetchPatients(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(patients);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        patients.filter((p) =>
          p.name?.toLowerCase().includes(q) ||
          p.contact?.includes(q) ||
          p.email?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await patientAPI.getAll();
      setPatients(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await patientAPI.delete(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
      setDelId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaved = (patient, isEdit) => {
    if (isEdit) {
      setPatients((prev) =>
        prev.map((p) => (p.id === patient.id ? patient : p))
      );
    } else {
      setPatients((prev) => [patient, ...prev]);
    }
    setShowModal(false);
    setEditData(null);
  };

  const canWrite = isAdmin || isReceptionist;

  // ── Avatar initials ──
  const initials = (name) => {
    if (!name) return "P";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  // ── Avatar color based on name ──
  const avatarColor = (name) => {
    const colors = [
      "rgba(15,118,110,0.2)",
      "rgba(99,102,241,0.2)",
      "rgba(168,85,247,0.2)",
      "rgba(20,184,166,0.2)",
      "rgba(245,158,11,0.2)",
    ];
    const i = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[i];
  };

  const textColors = [
    "#14B8A6", "#6366F1", "#A855F7", "#14B8A6", "#F59E0B",
  ];
  const avatarText = (name) => {
    const i = (name?.charCodeAt(0) || 0) % textColors.length;
    return textColors[i];
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">
            {filtered.length} patient{filtered.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => { setEditData(null); setShowModal(true); }}
            className="btn-primary !w-auto px-5"
          >
            <Plus size={16} />
            Add Patient
          </button>
        )}
      </div>

      {/* ── Search & filter bar ── */}
      <div className="card !p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 bg-surface
                        border border-border rounded-xl px-4 py-2.5">
          <Search size={15} className="text-textMuted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
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
        <button className="btn-secondary !w-auto gap-2 px-4">
          <Filter size={14} />
          Filter
        </button>
      </div>

      {/* ── Table ── */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col gap-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 bg-border rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-border rounded w-1/3" />
                  <div className="h-3 bg-border rounded w-1/4" />
                </div>
                <div className="h-3 bg-border rounded w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => { setEditData(null); setShowModal(true); }} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #1E293B" }}>
                  <th className="table-header">Patient</th>
                  <th className="table-header">Age / Gender</th>
                  <th className="table-header hidden md:table-cell">
                    Blood Group
                  </th>
                  <th className="table-header hidden lg:table-cell">Contact</th>
                  <th className="table-header hidden lg:table-cell">Address</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => (
                  <tr key={patient.id} className="table-row">

                    {/* Name + avatar */}
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center
                                     justify-center flex-shrink-0 text-sm
                                     font-bold"
                          style={{
                            background: avatarColor(patient.name),
                            color:      avatarText(patient.name),
                          }}
                        >
                          {initials(patient.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-textPrimary
                                        truncate">
                            {patient.name}
                          </p>
                          <p className="text-xs text-textMuted truncate">
                            {patient.email || `ID #${patient.id}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Age / Gender */}
                    <td className="table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="text-textPrimary font-medium">
                          {patient.age ? `${patient.age} yrs` : "—"}
                        </span>
                        <GenderBadge gender={patient.gender} />
                      </div>
                    </td>

                    {/* Blood group */}
                    <td className="table-cell hidden md:table-cell">
                      <BloodBadge blood={patient.bloodGroup} />
                    </td>

                    {/* Contact */}
                    <td className="table-cell hidden lg:table-cell">
                      {patient.contact ? (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-textMuted" />
                          <span>{patient.contact}</span>
                        </div>
                      ) : (
                        <span className="text-textMuted">—</span>
                      )}
                    </td>

                    {/* Address */}
                    <td className="table-cell hidden lg:table-cell max-w-xs">
                      <span className="truncate block">
                        {patient.address || "—"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/app/patients/${patient.id}`}
                          className="w-8 h-8 flex items-center justify-center
                                     rounded-lg text-textMuted
                                     hover:text-textPrimary transition-colors"
                          style={{ background: "rgba(51,65,85,0.2)" }}
                          title="View profile"
                        >
                          <Eye size={14} />
                        </Link>

                        {canWrite && (
                          <>
                            <button
                              onClick={() => {
                                setEditData(patient);
                                setShowModal(true);
                              }}
                              className="w-8 h-8 flex items-center justify-center
                                         rounded-lg transition-colors"
                              style={{
                                background: "rgba(20,184,166,0.1)",
                                color:      "#14B8A6",
                              }}
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              onClick={() => setDelId(patient.id)}
                              className="w-8 h-8 flex items-center justify-center
                                         rounded-lg transition-colors"
                              style={{
                                background: "rgba(239,68,68,0.1)",
                                color:      "#EF4444",
                              }}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <PatientModal
          editData={editData}
          onClose={() => { setShowModal(false); setEditData(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* ── Delete confirm modal ── */}
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
// PATIENT MODAL — Add / Edit
// ─────────────────────────────────────────────
function PatientModal({ editData, onClose, onSaved }) {
  const isEdit = Boolean(editData);

  const [form,    setForm]    = useState({
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

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Patient name is required");
      return;
    }
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await patientAPI.update(editData.id, form);
      } else {
        res = await patientAPI.create(form);
      }
      onSaved(res.data.data, isEdit);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: "rgba(2,6,23,0.8)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg card max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-textPrimary">
              {isEdit ? "Edit Patient" : "Register New Patient"}
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              {isEdit ? "Update patient information" : "Add a new patient record"}
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
          <div className="mb-4 px-4 py-3 rounded-xl text-danger text-sm
                          flex items-center gap-2"
               style={{ background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-danger
                             flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Muhammad Ali Khan"
              className="input"
            />
          </div>

          {/* Age + Gender row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-textSecondary">
                Age
              </label>
              <input
                name="age"
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={handleChange}
                placeholder="e.g. 35"
                className="input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-textSecondary">
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Contact + Blood group row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-textSecondary">
                Contact
              </label>
              <input
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="+92 300 0000000"
                className="input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-textSecondary">
                Blood Group
              </label>
              <select
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="patient@email.com"
              className="input"
            />
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Address
            </label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. House 12, Street 4, Gulberg, Lahore"
              className="input"
            />
          </div>

          {/* Medical history */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Medical History
            </label>
            <textarea
              name="history"
              value={form.history}
              onChange={handleChange}
              placeholder="Previous conditions, surgeries, allergies..."
              rows={3}
              className="input resize-none"
            />
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
                isEdit ? "Save changes" : "Register patient"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONFIRM DELETE MODAL
// ─────────────────────────────────────────────
function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: "rgba(2,6,23,0.8)", backdropFilter: "blur(4px)" }}>
      <div className="card w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center
                        mx-auto mb-4"
             style={{ background: "rgba(239,68,68,0.1)" }}>
          <Trash2 size={24} className="text-danger" />
        </div>
        <h3 className="text-lg font-bold text-textPrimary">Delete Patient?</h3>
        <p className="text-textSecondary text-sm mt-2 mb-6">
          This will permanently delete the patient record and all
          associated data. This action cannot be undone.
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