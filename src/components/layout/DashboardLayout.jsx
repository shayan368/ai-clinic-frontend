import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Bell, Search } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function DashboardLayout() {
  const { user }                      = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "U";

  return (
    <div className="flex h-screen overflow-hidden"
         style={{ background: "#F8FAFC" }}>

      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(15,23,42,0.4)",
                     backdropFilter: "blur(4px)" }}
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 flex">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top navbar ── */}
        <header className="flex items-center gap-4 px-6 py-4 flex-shrink-0"
                style={{
                  background:   "#FFFFFF",
                  borderBottom: "1px solid #E2E8F0",
                  boxShadow:    "0 1px 3px rgba(0,0,0,0.04)",
                }}>

          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-textMuted hover:text-textPrimary
                       transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:flex items-center
                          gap-3 rounded-xl px-4 py-2.5"
               style={{
                 background: "#F8FAFC",
                 border:     "1px solid #E2E8F0",
               }}>
            <Search size={15} className="text-textMuted flex-shrink-0" />
            <input
              type="text"
              placeholder="Search patients, appointments..."
              className="bg-transparent text-sm text-textPrimary
                         placeholder-textMuted outline-none w-full"
            />
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">

            {/* Bell */}
            <button
              className="relative w-9 h-9 flex items-center justify-center
                         rounded-xl text-textMuted hover:text-textPrimary
                         hover:bg-muted transition-colors"
              style={{ border: "1px solid #E2E8F0" }}
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2
                               rounded-full border-2 border-white"
                    style={{ background: "#EF4444" }} />
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2.5 px-3 py-1.5
                            rounded-xl cursor-pointer hover:bg-muted
                            transition-colors"
                 style={{ border: "1px solid #E2E8F0" }}>
              <div className="w-7 h-7 rounded-full flex items-center
                              justify-center text-xs font-bold"
                   style={{
                     background: "#CCFBF1",
                     color:      "#0F766E",
                   }}>
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-textPrimary
                               leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-textMuted capitalize mt-0.5">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}