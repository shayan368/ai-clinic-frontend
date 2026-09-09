import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, UserCheck, Users,
  BarChart3, Crown, LogOut, Activity,
  ChevronRight, CalendarDays, FileText,
  Brain, Settings, CalendarRange, Sparkles,
} from "lucide-react";

// ── Admin nav ──
const ADMIN_NAV = [
  { label: "Dashboard",    icon: LayoutDashboard, path: "/app/dashboard"      },
  { label: "Doctors",      icon: UserCheck,       path: "/app/admin/doctors"  },
  { label: "Staff",        icon: Users,           path: "/app/admin/staff"    },
  { label: "Analytics",    icon: BarChart3,       path: "/app/analytics"      },
  { label: "Settings",     icon: Settings,        path: "/app/settings"       },
];

// ── Doctor nav ──
const DOCTOR_NAV = [
  { label: "Dashboard",     icon: LayoutDashboard, tab: "dashboard"    },
  { label: "Patients",      icon: Users,           tab: "patients"     },
  { label: "My Schedule",   icon: CalendarRange,   tab: "appointments" },
  { label: "AI Diagnosis",  icon: Brain,           tab: "diagnosis",   proBadge: true },
  { label: "Prescriptions", icon: FileText,        tab: "prescriptions"},
  { label: "Analytics",     icon: BarChart3,       tab: "analytics"    },
  { label: "Profile",       icon: Settings,        tab: "profile"      },
];

// ── Receptionist nav ──
const RECEPTIONIST_NAV = [
  { label: "Dashboard",    icon: LayoutDashboard, tab: "dashboard"    },
  { label: "Appointments", icon: CalendarDays,    tab: "appointments" },
  { label: "Patients",     icon: Users,           tab: "patients"     },
  { label: "Profile",      icon: Settings,        tab: "profile"      },
];


// ── Patient nav — tab based ──
const PATIENT_NAV = [
  { label: "My Dashboard",  icon: LayoutDashboard, tab: "dashboard"    },
  { label: "Appointments",  icon: CalendarDays,    tab: "appointments" },
  { label: "Prescriptions", icon: FileText,        tab: "prescriptions"},
  { label: "AI & Health",   icon: Brain,           tab: "ai"           },
  { label: "Profile",       icon: Settings,        tab: "profile"      },
];

const getNavItems = (role) => {
  switch (role) {
    case "admin":        return ADMIN_NAV;
    case "doctor":       return DOCTOR_NAV;
    case "receptionist": return RECEPTIONIST_NAV;
    case "patient":      return PATIENT_NAV;
    default:             return [];
  }
};

const ROLE_LABELS = {
  admin:        "Administrator",
  doctor:       "Doctor",
  receptionist: "Receptionist",
  patient:      "Patient",
};

const AVATAR_COLORS = {
  admin:        { bg: "#FEF3C7", color: "#B45309" },
  doctor:       { bg: "#CCFBF1", color: "#0F766E" },
  receptionist: { bg: "#EEF2FF", color: "#6366F1" },
  patient:      { bg: "#FAF5FF", color: "#A855F7" },
};

export default function Sidebar({ onClose }) {
  const { user, logout, isPro } = useAuth();
  const navigate                = useNavigate();

  // ── Force re-render when patient tab changes ──
  
  const [activeDoctorTab, setActiveDoctorTab] = useState(
  window.__doctorTab || "dashboard"
);
  const [activePatientTab, setActivePatientTab] = useState(
    window.__patientTab || "dashboard"
  );
const [activeReceptionistTab, setActiveReceptionistTab] = useState(
  window.__receptionistTab || "dashboard"
);

useEffect(() => {
  const handler = (e) => setActiveReceptionistTab(e.detail);
  window.addEventListener("receptionist-tab-change", handler);
  return () =>
    window.removeEventListener("receptionist-tab-change", handler);
}, []);

useEffect(() => {
  const handler = (e) => setActiveDoctorTab(e.detail);
  window.addEventListener("doctor-tab-change", handler);
  return () =>
    window.removeEventListener("doctor-tab-change", handler);
}, []);

  useEffect(() => {
    const handler = (e) => setActivePatientTab(e.detail);
    window.addEventListener("patient-tab-change", handler);
    return () =>
      window.removeEventListener("patient-tab-change", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = getNavItems(user?.role);
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "U";
  const av = AVATAR_COLORS[user?.role] ||
    { bg: "#F1F5F9", color: "#64748B" };

  return (
    <aside style={{
      display:       "flex",
      flexDirection: "column",
      height:        "100%",
      width:         "240px",
      flexShrink:    0,
      background:    "#FFFFFF",
      borderRight:   "1px solid #E2E8F0",
    }}>

      {/* ── Logo ── */}
      <div style={{
        display:      "flex",
        alignItems:   "center",
        gap:          "10px",
        padding:      "20px",
        borderBottom: "1px solid #E2E8F0",
        flexShrink:   0,
      }}>
        <div style={{
          width:          "32px",
          height:         "32px",
          borderRadius:   "10px",
          background:     "linear-gradient(135deg,#0F766E,#6366F1)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
        }}>
          <Activity size={16} color="#FFFFFF" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: "15px",
                      color: "#0F172A", margin: 0 }}>
            Lifecare
          </p>
          <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>
            {ROLE_LABELS[user?.role] || "Portal"}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            background: "none", border: "none",
            cursor: "pointer", color: "#94A3B8",
            fontSize: "18px", lineHeight: 1, padding: "4px",
          }}>
            ✕
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{
        flex:          1,
        overflowY:     "auto",
        padding:       "12px",
        display:       "flex",
        flexDirection: "column",
        gap:           "2px",
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;

          // ── Patient tab buttons ──
          if (item.tab) {
  const isPatientNav = user?.role === "patient";
  const isDoctorNav  = user?.role === "doctor";
  const currentTab =
  user?.role === "patient"      ? activePatientTab :
  user?.role === "doctor"       ? activeDoctorTab  :
  user?.role === "receptionist" ? activeReceptionistTab :
  "dashboard";
  const isActive     = currentTab === item.tab;

  return (
    <button
      key={item.tab}
      onClick={() => {
        if (isPatientNav) {
          window.__patientTab = item.tab;
          window.dispatchEvent(
            new CustomEvent("patient-tab-change",
              { detail: item.tab })
          );
        } else if (isDoctorNav) {
          window.__doctorTab = item.tab;
          window.dispatchEvent(
            new CustomEvent("doctor-tab-change",
              { detail: item.tab })
          );
        }
        else if (user?.role === "receptionist") {
  window.__receptionistTab = item.tab;
  window.dispatchEvent(
    new CustomEvent("receptionist-tab-change",
      { detail: item.tab })
  );
}
        if (onClose) onClose();
      }}
      style={{
        display:     "flex",
        alignItems:  "center",
        gap:         "10px",
        padding:     "10px 12px",
        borderRadius:"10px",
        fontSize:    "14px",
        fontWeight:  isActive ? 600 : 400,
        color:       isActive ? "#0F766E" : "#475569",
        background:  isActive ? "#F0FDFA" : "transparent",
        transition:  "all 0.15s",
        border:      "none",
        cursor:      "pointer",
        width:       "100%",
        textAlign:   "left",
      }}
    >
      <Icon size={17} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.proBadge && !isPro && (
        <span style={{
          fontSize:     "10px", fontWeight: 600,
          padding:      "2px 6px", borderRadius: "6px",
          background:   "#FEF3C7", color: "#B45309",
        }}>
          PRO
        </span>
      )}
    </button>
  );
}

          // ── NavLink for non-patient roles ──
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={({ isActive }) => ({
                display:        "flex",
                alignItems:     "center",
                gap:            "10px",
                padding:        "10px 12px",
                borderRadius:   "10px",
                textDecoration: "none",
                fontSize:       "14px",
                fontWeight:     isActive ? 600 : 400,
                color:          isActive ? "#0F766E" : "#475569",
                background:     isActive ? "#F0FDFA" : "transparent",
                transition:     "all 0.15s",
              })}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.proBadge && !isPro && (
                <span style={{
                  fontSize:     "10px",
                  fontWeight:   600,
                  padding:      "2px 6px",
                  borderRadius: "6px",
                  background:   "#FEF3C7",
                  color:        "#B45309",
                }}>
                  PRO
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Upgrade banner — non-admin free users ── */}
      {!isPro && (user?.role === "doctor" || user?.role === "patient") && (
        <div style={{
          margin:       "0 12px 12px",
          padding:      "16px",
          borderRadius: "12px",
          background:   "linear-gradient(135deg,#F0FDFA,#EEF2FF)",
          border:       "1px solid #CCFBF1",
          flexShrink:   0,
        }}>
          <div style={{ display: "flex", alignItems: "center",
                        gap: "8px", marginBottom: "8px" }}>
            <Crown size={14} color="#F59E0B" />
            <span style={{ fontSize: "12px", fontWeight: 600,
                           color: "#0F172A" }}>
              Upgrade to Pro
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "#64748B",
                      marginBottom: "12px", lineHeight: 1.5 }}>
            Unlock AI diagnosis, risk flagging and advanced analytics.
          </p>
          <NavLink to="/app/settings" style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            gap:            "6px",
            padding:        "8px 12px",
            borderRadius:   "8px",
            background:     "linear-gradient(135deg,#0F766E,#6366F1)",
            color:          "#FFFFFF",
            textDecoration: "none",
            fontSize:       "12px",
            fontWeight:     600,
          }}>
            Upgrade now
            <ChevronRight size={12} />
          </NavLink>
        </div>
      )}

      {/* ── Admin plan banner ── */}
      {user?.role === "admin" && (
        <div style={{
          margin:       "0 12px 12px",
          padding:      "12px 16px",
          borderRadius: "12px",
          background:   isPro
            ? "linear-gradient(135deg,#FEF3C7,#FFFBEB)"
            : "#F8FAFC",
          border:       isPro
            ? "1px solid #FDE68A" : "1px solid #E2E8F0",
          flexShrink:   0,
        }}>
          <div style={{ display: "flex", alignItems: "center",
                        gap: "8px" }}>
            <Crown size={14} color={isPro ? "#F59E0B" : "#CBD5E1"} />
            <span style={{ fontSize: "12px", fontWeight: 600,
                           color: isPro ? "#B45309" : "#94A3B8" }}>
              {isPro ? "Pro Plan Active" : "Free Plan"}
            </span>
          </div>
          {!isPro && (
            <NavLink to="/app/settings" style={{
              display:        "block",
              marginTop:      "10px",
              padding:        "7px 12px",
              borderRadius:   "8px",
              background:     "linear-gradient(135deg,#0F766E,#6366F1)",
              color:          "#FFFFFF",
              textDecoration: "none",
              fontSize:       "12px",
              fontWeight:     600,
              textAlign:      "center",
            }}>
              Upgrade clinic to Pro
            </NavLink>
          )}
        </div>
      )}

      {/* ── User footer ── */}
      <div style={{
        borderTop:  "1px solid #E2E8F0",
        padding:    "12px",
        flexShrink: 0,
      }}>
        <div
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "10px",
            padding:      "10px 12px",
            borderRadius: "10px",
            cursor:       "default",
            transition:   "background 0.15s",
          }}
          onMouseEnter={(e) =>
            e.currentTarget.style.background = "#F8FAFC"
          }
          onMouseLeave={(e) =>
            e.currentTarget.style.background = "transparent"
          }
        >
          <div style={{
            width:          "34px",
            height:         "34px",
            borderRadius:   "50%",
            background:     av.bg,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       "13px",
            fontWeight:     700,
            color:          av.color,
            flexShrink:     0,
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize:     "13px",
              fontWeight:   600,
              color:        "#0F172A",
              margin:       0,
              whiteSpace:   "nowrap",
              overflow:     "hidden",
              textOverflow: "ellipsis",
            }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p style={{
              fontSize:     "11px",
              color:        "#94A3B8",
              margin:       0,
              whiteSpace:   "nowrap",
              overflow:     "hidden",
              textOverflow: "ellipsis",
            }}>
              {ROLE_LABELS[user?.role]}
              {isPro && (
                <span style={{ color: "#F59E0B",
                               marginLeft: "4px", fontWeight: 600 }}>
                  · Pro
                </span>
              )}
            </p>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: "none",
              border:     "none",
              cursor:     "pointer",
              color:      "#CBD5E1",
              padding:    "4px",
              display:    "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) =>
              e.currentTarget.style.color = "#EF4444"
            }
            onMouseLeave={(e) =>
              e.currentTarget.style.color = "#CBD5E1"
            }
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}