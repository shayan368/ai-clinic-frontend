import { useState, useEffect } from "react";
import { userAPI, authAPI } from "../../api/axios.js";
import {
  Users, Plus, X, AlertTriangle,
  Search, RefreshCw,
} from "lucide-react";

const s = {
  card: {
    background:   "#FFFFFF",
    borderRadius: "16px",
    border:       "1px solid #E2E8F0",
    padding:      "24px",
    boxShadow:    "0 1px 3px rgba(0,0,0,0.06)",
  },
  label: {
    fontSize:      "12px",
    fontWeight:    600,
    color:         "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom:  "6px",
    display:       "block",
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
};

const ROLE_CONFIG = {
  receptionist: {
    color: "#6366F1", bg: "#EEF2FF",
    label: "Receptionist",
  },
  patient: {
    color: "#A855F7", bg: "#FAF5FF",
    label: "Patient",
  },
  admin: {
    color: "#B45309", bg: "#FEF3C7",
    label: "Admin",
  },
  doctor: {
    color: "#0F766E", bg: "#F0FDFA",
    label: "Doctor",
  },
};

export default function AdminStaff() {
  const [allUsers,   setAllUsers]   = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let result = [...allUsers];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    setFiltered(result);
  }, [search, roleFilter, allUsers]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await userAPI.getAll();
      // Show everyone except the logged-in admin themselves
      setAllUsers(res.data.data || []);
    } catch (err) {
      setError("Failed to load users. Make sure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (newUser) => {
    setAllUsers((prev) => [newUser, ...prev]);
    setShowModal(false);
  };

  const initials = (u) =>
    `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase();

  // ── Count per role ──
  const counts = {
    doctor:       allUsers.filter((u) => u.role === "doctor").length,
    receptionist: allUsers.filter((u) => u.role === "receptionist").length,
    patient:      allUsers.filter((u) => u.role === "patient").length,
    admin:        allUsers.filter((u) => u.role === "admin").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between", flexWrap: "wrap",
                    gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700,
                       color: "#0F172A", margin: 0 }}>
            Staff & Users
          </h1>
          <p style={{ fontSize: "14px", color: "#94A3B8",
                      margin: "4px 0 0" }}>
            All registered users — {allUsers.length} total
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchUsers}
            style={{ ...s.btnSec }}
            title="Refresh"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button style={s.btn} onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add Staff
          </button>
        </div>
      </div>

      {/* ── Role summary cards ── */}
      <div style={{ display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(140px,1fr))",
                    gap: "12px" }}>
        {[
          { role: "all",          label: "All Users",
            count: allUsers.length,
            color: "#0F172A", bg: "#F8FAFC" },
          { role: "doctor",       label: "Doctors",
            count: counts.doctor,
            color: "#0F766E", bg: "#F0FDFA" },
          { role: "receptionist", label: "Receptionists",
            count: counts.receptionist,
            color: "#6366F1", bg: "#EEF2FF" },
          { role: "patient",      label: "Patients",
            count: counts.patient,
            color: "#A855F7", bg: "#FAF5FF" },
          { role: "admin",        label: "Admins",
            count: counts.admin,
            color: "#B45309", bg: "#FEF3C7" },
        ].map((item) => (
          <button
            key={item.role}
            onClick={() => setRoleFilter(item.role)}
            style={{
              ...s.card,
              padding:    "16px",
              cursor:     "pointer",
              textAlign:  "left",
              background: item.bg,
              border:     roleFilter === item.role
                ? `2px solid ${item.color}`
                : "1px solid #E2E8F0",
              transition: "all 0.15s",
            }}
          >
            <p style={{ fontSize: "26px", fontWeight: 700,
                        color: item.color, margin: 0 }}>
              {item.count}
            </p>
            <p style={{ fontSize: "12px", color: item.color,
                        margin: "4px 0 0", fontWeight: 500,
                        opacity: 0.8 }}>
              {item.label}
            </p>
          </button>
        ))}
      </div>

      {/* ── Search + filter ── */}
      <div style={{ ...s.card, padding: "16px", display: "flex",
                    gap: "12px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px",
                      position: "relative" }}>
          <Search size={15} style={{
            position:  "absolute",
            left:      "14px",
            top:       "50%",
            transform: "translateY(-50%)",
            color:     "#94A3B8",
          }} />
          <input
            style={{ ...s.input, paddingLeft: "42px" }}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position:   "absolute",
                right:      "12px",
                top:        "50%",
                transform:  "translateY(-50%)",
                background: "none",
                border:     "none",
                cursor:     "pointer",
                color:      "#94A3B8",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ ...s.input, width: "auto",
                   minWidth: "150px", cursor: "pointer" }}
        >
          <option value="all">All Roles</option>
          <option value="doctor">Doctor</option>
          <option value="receptionist">Receptionist</option>
          <option value="patient">Patient</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background:   "#FEE2E2",
          border:       "1px solid #FECACA",
          borderRadius: "12px",
          padding:      "14px 18px",
          color:        "#DC2626",
          fontSize:     "14px",
          display:      "flex",
          alignItems:   "center",
          gap:          "10px",
        }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* ── Users table ── */}
      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>

        {/* Table header */}
        <div style={{
          display:          "grid",
          gridTemplateColumns: "2fr 1fr 2fr 1fr 1fr",
          padding:          "12px 20px",
          borderBottom:     "1px solid #E2E8F0",
          background:       "#F8FAFC",
        }}>
          {["Name", "Role", "Email", "Plan", "Joined"].map((h) => (
            <p key={h} style={{
              fontSize:      "11px",
              fontWeight:    600,
              color:         "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin:        0,
            }}>
              {h}
            </p>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{
              width:       "32px", height: "32px",
              borderRadius: "50%",
              border:       "3px solid #E2E8F0",
              borderTopColor: "#14B8A6",
              animation:    "spin 0.8s linear infinite",
              margin:       "0 auto 12px",
            }} />
            <p style={{ color: "#94A3B8", fontSize: "14px" }}>
              Loading users...
            </p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <Users size={36} color="#CBD5E1"
                   style={{ marginBottom: "12px" }} />
            <p style={{ color: "#475569", fontSize: "15px",
                        fontWeight: 500, margin: 0 }}>
              No users found
            </p>
            <p style={{ color: "#94A3B8", fontSize: "13px",
                        marginTop: "6px" }}>
              {search
                ? "Try a different search term"
                : "No users registered yet"}
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.map((u, i) => {
          const cfg = ROLE_CONFIG[u.role] ||
            { color: "#64748B", bg: "#F1F5F9", label: u.role };

          return (
            <div
              key={u.id || i}
              style={{
                display:             "grid",
                gridTemplateColumns: "2fr 1fr 2fr 1fr 1fr",
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
              }
            >
              {/* Name + avatar */}
              <div style={{ display: "flex", alignItems: "center",
                            gap: "12px" }}>
                <div style={{
                  width:          "36px",
                  height:         "36px",
                  borderRadius:   "50%",
                  background:     cfg.bg,
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  fontSize:       "13px",
                  fontWeight:     700,
                  color:          cfg.color,
                  flexShrink:     0,
                }}>
                  {initials(u)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500,
                              color: "#0F172A", margin: 0,
                              whiteSpace: "nowrap", overflow: "hidden",
                              textOverflow: "ellipsis" }}>
                    {u.firstName} {u.lastName}
                  </p>
                  {u.specialization && (
                    <p style={{ fontSize: "11px", color: "#94A3B8",
                                margin: 0 }}>
                      {u.specialization}
                    </p>
                  )}
                </div>
              </div>

              {/* Role badge */}
              <div>
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
                  {cfg.label}
                </span>
              </div>

              {/* Email */}
              <p style={{ fontSize: "13px", color: "#64748B",
                          margin: 0, whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis" }}>
                {u.email}
              </p>

              {/* Plan */}
              <span style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          "4px",
                padding:      "3px 10px",
                borderRadius: "20px",
                fontSize:     "12px",
                fontWeight:   500,
                background:   u.subscriptionPlan === "pro"
                  ? "#FEF3C7" : "#F1F5F9",
                color:        u.subscriptionPlan === "pro"
                  ? "#B45309" : "#64748B",
              }}>
                {u.subscriptionPlan === "pro" ? "⭐ Pro" : "Free"}
              </span>

              {/* Joined date */}
              <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>
                {u.createdAt
                  ? new Date(u.createdAt).toLocaleDateString("en-PK", {
                      day:   "numeric",
                      month: "short",
                      year:  "numeric",
                    })
                  : "—"}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Add Staff Modal ── */}
      {showModal && (
        <AddStaffModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ADD STAFF MODAL
// ─────────────────────────────────────────────
function AddStaffModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName:  "",
    email:     "",
    password:  "",
    role:      "receptionist",
    phone:     "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName || !form.email || !form.password) {
      setError("First name, email and password are required");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await authAPI.register(form);
      onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

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
    }}>
      <div style={{
        background:   "#FFFFFF",
        borderRadius: "20px",
        border:       "1px solid #E2E8F0",
        padding:      "28px",
        width:        "100%",
        maxWidth:     "440px",
        boxShadow:    "0 20px 60px rgba(0,0,0,0.15)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700,
                         color: "#0F172A", margin: 0 }}>
              Add Staff Member
            </h2>
            <p style={{ fontSize: "13px", color: "#94A3B8",
                        margin: "4px 0 0" }}>
              Register a new user account
            </p>
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
          }}>
            <X size={15} />
          </button>
        </div>

        {/* Error */}
        {error && (
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
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >

          {/* Name row */}
          <div style={{ display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px" }}>
            <div>
              <label style={s.label}>First Name *</label>
              <input
                style={s.input}
                placeholder="Nadia"
                value={form.firstName}
                onChange={(e) => setForm((p) =>
                  ({ ...p, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label style={s.label}>Last Name</label>
              <input
                style={s.input}
                placeholder="Hussain"
                value={form.lastName}
                onChange={(e) => setForm((p) =>
                  ({ ...p, lastName: e.target.value }))}
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label style={s.label}>Role *</label>
            <select
              style={{ ...s.input, cursor: "pointer" }}
              value={form.role}
              onChange={(e) => setForm((p) =>
                ({ ...p, role: e.target.value }))}
            >
              <option value="receptionist">Receptionist</option>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label style={s.label}>Email *</label>
            <input
              style={s.input}
              type="email"
              placeholder="staff@lifecare.pk"
              value={form.email}
              onChange={(e) => setForm((p) =>
                ({ ...p, email: e.target.value }))}
            />
          </div>

          {/* Password */}
          <div>
            <label style={s.label}>Password *</label>
            <input
              style={s.input}
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => setForm((p) =>
                ({ ...p, password: e.target.value }))}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={s.label}>Phone</label>
            <input
              style={s.input}
              type="tel"
              placeholder="+92 300 0000000"
              value={form.phone}
              onChange={(e) => setForm((p) =>
                ({ ...p, phone: e.target.value }))}
            />
          </div>

          {/* Buttons */}
          <div style={{
            display:      "flex",
            gap:          "12px",
            paddingTop:   "8px",
            borderTop:    "1px solid #E2E8F0",
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{ ...s.btnSec, flex: 1,
                       justifyContent: "center" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ ...s.btn, flex: 1,
                       justifyContent: "center",
                       opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Adding..." : "Add Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}