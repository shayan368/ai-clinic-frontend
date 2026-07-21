import { useState, useEffect } from "react";
import { doctorAPI, appointmentAPI, prescriptionAPI }
  from "../../api/axios.js";
import {
  Stethoscope, Search, Plus, UserCheck,
  CalendarDays, FileText, TrendingUp, X,
  CheckCircle2, AlertTriangle,
} from "lucide-react";
import { authAPI } from "../../api/axios.js";

const s = {
  card: {
    background: "#FFFFFF", borderRadius: "16px",
    border: "1px solid #E2E8F0", padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  label: {
    fontSize: "12px", fontWeight: 600,
    color: "#94A3B8", textTransform: "uppercase",
    letterSpacing: "0.05em", marginBottom: "6px",
    display: "block",
  },
  input: {
    width: "100%", padding: "10px 14px",
    border: "1px solid #E2E8F0", borderRadius: "10px",
    fontSize: "14px", color: "#0F172A",
    background: "#F8FAFC", outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    display: "inline-flex", alignItems: "center",
    gap: "8px", padding: "10px 20px",
    borderRadius: "10px", fontSize: "14px",
    fontWeight: 600, cursor: "pointer",
    border: "none",
    background: "linear-gradient(135deg,#0F766E,#6366F1)",
    color: "#FFFFFF",
  },
  btnSec: {
    display: "inline-flex", alignItems: "center",
    gap: "8px", padding: "9px 16px",
    borderRadius: "10px", fontSize: "13px",
    fontWeight: 500, cursor: "pointer",
    border: "1px solid #E2E8F0",
    background: "#FFFFFF", color: "#475569",
  },
};

export default function AdminDoctors() {
  const [doctors,    setDoctors]    = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [stats,      setStats]      = useState({});
  const [selected,   setSelected]   = useState(null);

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      doctors.filter((d) =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
        (d.specialization || "").toLowerCase().includes(q)
      )
    );
  }, [search, doctors]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await doctorAPI.getAll();
      const list = res.data.data || [];
      setDoctors(list);

      // Fetch stats for each doctor
      const statsMap = {};
      await Promise.all(
        list.map(async (d) => {
          try {
            const r = await doctorAPI.getStats(d.id);
            statsMap[d.id] = r.data.data;
          } catch { statsMap[d.id] = {}; }
        })
      );
      setStats(statsMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initials = (d) =>
    `${d.firstName?.[0] ?? ""}${d.lastName?.[0] ?? ""}`.toUpperCase();

  const COLORS = ["#CCFBF1:#0F766E", "#EEF2FF:#6366F1",
                  "#FAF5FF:#A855F7", "#FEF3C7:#B45309"];
  const avatarStyle = (i) => {
    const [bg, color] = COLORS[i % COLORS.length].split(":");
    return { background: bg, color };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700,
                       color: "#0F172A", margin: 0 }}>
            Doctors
          </h1>
          <p style={{ fontSize: "14px", color: "#94A3B8",
                      margin: "4px 0 0" }}>
            {filtered.length} doctor{filtered.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <button style={s.btn} onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Add Doctor
        </button>
      </div>

      {/* Search */}
      <div style={{ ...s.card, padding: "16px" }}>
        <div style={{ position: "relative" }}>
          <Search size={15} style={{
            position: "absolute", left: "14px",
            top: "50%", transform: "translateY(-50%)",
            color: "#94A3B8",
          }} />
          <input
            style={{ ...s.input, paddingLeft: "42px" }}
            placeholder="Search by name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position: "absolute", right: "12px",
              top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none",
              cursor: "pointer", color: "#94A3B8",
            }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Doctor cards grid */}
      {loading ? (
        <div style={{ display: "grid",
                      gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
                      gap: "16px" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ ...s.card, height: "180px",
                                  background: "#F1F5F9" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...s.card, textAlign: "center", padding: "60px" }}>
          <Stethoscope size={32} color="#CBD5E1"
                       style={{ marginBottom: "12px" }} />
          <p style={{ color: "#94A3B8", fontSize: "14px" }}>
            No doctors found
          </p>
        </div>
      ) : (
        <div style={{ display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill,minmax(280px,1fr))",
                      gap: "16px" }}>
          {filtered.map((doc, i) => {
            const ds = stats[doc.id] || {};
            const av = avatarStyle(i);
            return (
              <div key={doc.id} style={{
                ...s.card, cursor: "pointer",
                transition: "all 0.2s",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(0,0,0,0.10)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 1px 3px rgba(0,0,0,0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                onClick={() => setSelected(doc)}
              >
                {/* Avatar + name */}
                <div style={{ display: "flex", alignItems: "center",
                              gap: "14px", marginBottom: "16px" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "14px",
                    display: "flex", alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px", fontWeight: 700,
                    flexShrink: 0,
                    background: av.background, color: av.color,
                  }}>
                    {initials(doc)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: "15px",
                                color: "#0F172A", margin: 0 }}>
                      Dr. {doc.firstName} {doc.lastName}
                    </p>
                    <p style={{ fontSize: "12px", color: "#94A3B8",
                                margin: "2px 0 0" }}>
                      {doc.specialization || "General Practice"}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid",
                              gridTemplateColumns: "1fr 1fr 1fr",
                              gap: "8px" }}>
                  {[
                    { label: "Appts",  value: ds.totalAppointments || 0,
                      color: "#0F766E", bg: "#F0FDFA" },
                    { label: "Done",   value: ds.completedAppointments || 0,
                      color: "#15803D", bg: "#DCFCE7" },
                    { label: "Rx",     value: ds.totalPrescriptions || 0,
                      color: "#6366F1", bg: "#EEF2FF" },
                  ].map((s2) => (
                    <div key={s2.label} style={{
                      background: s2.bg, borderRadius: "10px",
                      padding: "10px 8px", textAlign: "center",
                    }}>
                      <p style={{ fontSize: "18px", fontWeight: 700,
                                  color: s2.color, margin: 0 }}>
                        {s2.value}
                      </p>
                      <p style={{ fontSize: "10px", color: s2.color,
                                  margin: "2px 0 0", fontWeight: 500 }}>
                        {s2.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Contact */}
                {doc.phone && (
                  <p style={{ fontSize: "12px", color: "#94A3B8",
                              marginTop: "12px", marginBottom: 0 }}>
                    📞 {doc.phone}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Doctor Modal */}
      {showModal && (
        <AddDoctorModal
          onClose={() => setShowModal(false)}
          onSaved={(doc) => {
            setDoctors((prev) => [doc, ...prev]);
            setShowModal(false);
          }}
        />
      )}

      {/* Doctor detail modal */}
      {selected && (
        <DoctorDetailModal
          doctor={selected}
          stats={stats[selected.id] || {}}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── Add Doctor Modal ──
function AddDoctorModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    password: "", specialization: "", phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password) {
      setError("First name, email and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({ ...form, role: "doctor" });
      onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const s2 = {
    overlay: {
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
    },
    modal: {
      background: "#FFFFFF", borderRadius: "20px",
      border: "1px solid #E2E8F0", padding: "28px",
      width: "100%", maxWidth: "480px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    },
  };

  return (
    <div style={s2.overlay}>
      <div style={s2.modal}>
        <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700,
                         color: "#0F172A", margin: 0 }}>
              Add New Doctor
            </h2>
            <p style={{ fontSize: "13px", color: "#94A3B8",
                        margin: "4px 0 0" }}>
              Register a doctor account
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "#F1F5F9", border: "none",
            borderRadius: "8px", width: "32px", height: "32px",
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#64748B",
          }}>
            <X size={15} />
          </button>
        </div>

        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FECACA",
                        borderRadius: "10px", padding: "12px 16px",
                        marginBottom: "16px", color: "#DC2626",
                        fontSize: "13px", display: "flex",
                        alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: "12px" }}>
            {[
              { name: "firstName", label: "First Name", placeholder: "Imran" },
              { name: "lastName",  label: "Last Name",  placeholder: "Sheikh" },
            ].map((f) => (
              <div key={f.name}>
                <label style={s.label}>{f.label}</label>
                <input
                  style={s.input}
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={(e) => setForm((p) =>
                    ({ ...p, [f.name]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          {[
            { name: "email",          label: "Email",          type: "email",
              placeholder: "dr.imran@lifecare.pk" },
            { name: "password",       label: "Password",       type: "password",
              placeholder: "Min 6 characters" },
            { name: "specialization", label: "Specialization", type: "text",
              placeholder: "e.g. Cardiology" },
            { name: "phone",          label: "Phone",          type: "tel",
              placeholder: "+92 300 0000000" },
          ].map((f) => (
            <div key={f.name}>
              <label style={s.label}>{f.label}</label>
              <input
                style={s.input}
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={(e) => setForm((p) =>
                  ({ ...p, [f.name]: e.target.value }))}
              />
            </div>
          ))}

          <div style={{ display: "flex", gap: "12px", paddingTop: "8px",
                        borderTop: "1px solid #E2E8F0" }}>
            <button type="button" onClick={onClose}
                    style={{ ...s.btnSec, flex: 1,
                             justifyContent: "center" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
                    style={{ ...s.btn, flex: 1,
                             justifyContent: "center",
                             opacity: loading ? 0.7 : 1 }}>
              {loading ? "Adding..." : "Add Doctor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Doctor Detail Modal ──
function DoctorDetailModal({ doctor, stats, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#FFFFFF", borderRadius: "20px",
        border: "1px solid #E2E8F0", padding: "28px",
        width: "100%", maxWidth: "440px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "14px",
              background: "#CCFBF1", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: "18px", fontWeight: 700, color: "#0F766E",
            }}>
              {doctor.firstName?.[0]}{doctor.lastName?.[0]}
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700,
                           color: "#0F172A", margin: 0 }}>
                Dr. {doctor.firstName} {doctor.lastName}
              </h2>
              <p style={{ fontSize: "13px", color: "#94A3B8",
                          margin: "2px 0 0" }}>
                {doctor.specialization || "General Practice"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "#F1F5F9", border: "none",
            borderRadius: "8px", width: "32px", height: "32px",
            cursor: "pointer", color: "#64748B",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={15} />
          </button>
        </div>

        {/* Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px",
                      marginBottom: "20px",
                      paddingBottom: "20px",
                      borderBottom: "1px solid #E2E8F0" }}>
          {[
            { label: "Email",  value: doctor.email },
            { label: "Phone",  value: doctor.phone || "Not set" },
            { label: "Plan",   value: doctor.subscriptionPlan || "free" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex",
                                          justifyContent: "space-between",
                                          fontSize: "14px" }}>
              <span style={{ color: "#94A3B8" }}>{item.label}</span>
              <span style={{ color: "#0F172A", fontWeight: 500 }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
                      gap: "12px" }}>
          {[
            { label: "Total Appointments",
              value: stats.totalAppointments || 0,
              color: "#0F766E", bg: "#F0FDFA" },
            { label: "Completed",
              value: stats.completedAppointments || 0,
              color: "#15803D", bg: "#DCFCE7" },
            { label: "Pending",
              value: stats.pendingAppointments || 0,
              color: "#B45309", bg: "#FEF3C7" },
            { label: "Prescriptions",
              value: stats.totalPrescriptions || 0,
              color: "#6366F1", bg: "#EEF2FF" },
          ].map((s2) => (
            <div key={s2.label} style={{
              background: s2.bg, borderRadius: "12px",
              padding: "14px", textAlign: "center",
            }}>
              <p style={{ fontSize: "24px", fontWeight: 700,
                          color: s2.color, margin: 0 }}>
                {s2.value}
              </p>
              <p style={{ fontSize: "11px", color: s2.color,
                          margin: "4px 0 0", fontWeight: 500 }}>
                {s2.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}