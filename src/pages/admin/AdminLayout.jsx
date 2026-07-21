import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  LayoutDashboard, Users, UserCheck,
  BarChart3, Crown, LogOut, Activity,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",    icon: LayoutDashboard, path: "/app/dashboard"    },
  { label: "Doctors",      icon: UserCheck,       path: "/app/admin/doctors" },
  { label: "Staff",        icon: Users,           path: "/app/admin/staff"   },
  { label: "Analytics",    icon: BarChart3,        path: "/app/analytics"     },
  { label: "Subscription", icon: Crown,           path: "/app/settings"      },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div style={{ display: "flex", height: "100vh",
                  background: "#F8FAFC", overflow: "hidden" }}>

      {/* Sidebar */}
      <aside style={{
        width: "240px", flexShrink: 0,
        background: "#FFFFFF",
        borderRight: "1px solid #E2E8F0",
        display: "flex", flexDirection: "column",
      }}>

        {/* Logo */}
        <div style={{ padding: "20px 24px",
                      borderBottom: "1px solid #E2E8F0",
                      display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "linear-gradient(135deg,#0F766E,#6366F1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={16} color="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "15px",
                        color: "#0F172A", margin: 0 }}>
              Lifecare
            </p>
            <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>
              Admin Panel
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px",
                      display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
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
                <Icon size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ borderTop: "1px solid #E2E8F0", padding: "12px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 12px", borderRadius: "10px",
          }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "#CCFBF1", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700, color: "#0F766E",
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 600,
                          color: "#0F172A", margin: 0,
                          whiteSpace: "nowrap", overflow: "hidden",
                          textOverflow: "ellipsis" }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>
                Administrator
              </p>
            </div>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              title="Logout"
              style={{ background: "none", border: "none",
                       cursor: "pointer", color: "#94A3B8",
                       padding: "4px" }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex",
                    flexDirection: "column", overflow: "hidden" }}>
        <main style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}