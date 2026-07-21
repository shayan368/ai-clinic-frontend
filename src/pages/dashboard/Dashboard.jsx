import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { doctorAPI, appointmentAPI, patientAPI } from "../../api/axios.js";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Users, CalendarDays, TrendingUp, UserCheck,
  Clock, CheckCircle2, Brain, ArrowUpRight,
  Activity, Stethoscope,
} from "lucide-react";


// ── Dummy chart data ──
const REVENUE_DATA = [
  { month: "Jul", revenue: 4200, patients: 38 },
  { month: "Aug", revenue: 5800, patients: 52 },
  { month: "Sep", revenue: 4900, patients: 44 },
  { month: "Oct", revenue: 7200, patients: 61 },
  { month: "Nov", revenue: 6100, patients: 55 },
  { month: "Dec", revenue: 8400, patients: 73 },
  { month: "Jan", revenue: 7600, patients: 68 },
  { month: "Feb", revenue: 9200, patients: 82 },
  { month: "Mar", revenue: 8700, patients: 78 },
  { month: "Apr", revenue: 11000, patients: 95 },
  { month: "May", revenue: 10400, patients: 91 },
  { month: "Jun", revenue: 12800, patients: 108 },
];

const DISEASE_DATA = [
  { name: "Cardiovascular", value: 32, color: "#6366f1" },
  { name: "Respiratory", value: 24, color: "#8b5cf6" },
  { name: "Diabetes", value: 18, color: "#22c55e" },
  { name: "Neurological", value: 14, color: "#f59e0b" },
  { name: "Other", value: 12, color: "#3f3f5a" },
];

const ACTIVITY_FEED = [
  {
    id: 1,
    title: "New appointment booked",
    desc: "Sophia Williams scheduled for 10:15 AM",
    time: "2m ago",
    color: "bg-primary",
  },
  {
    id: 2,
    title: "AI diagnosis completed",
    desc: "Risk assessment for Marcus Rodriguez",
    time: "12m ago",
    color: "bg-accent",
  },
  {
    id: 3,
    title: "Prescription generated",
    desc: "Dr. Sarah Chen → Emma Thompson",
    time: "28m ago",
    color: "bg-success",
  },
  {
    id: 4,
    title: "Critical alert resolved",
    desc: "Olivia Martinez vitals stabilized",
    time: "1h ago",
    color: "bg-warning",
  },
  {
    id: 5,
    title: "New patient registered",
    desc: "Ethan Brown added to records",
    time: "2h ago",
    color: "bg-primary",
  },
];

// ── Stat card component ──
const StatCard = ({ icon: Icon, label, value, change, positive, color, bg }) => (
  <div className="card flex flex-col gap-4 hover:shadow-cardHover
                  hover:-translate-y-0.5 transition-all duration-200">
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 rounded-xl flex items-center
                      justify-center"
        style={{ background: bg }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium
                       ${positive ? "text-success" : "text-danger"}`}>
        <ArrowUpRight
          size={12}
          className={positive ? "" : "rotate-180"}
        />
        {change}
      </div>
    </div>
    <div>
      <p className="text-2xl font-bold text-textPrimary">{value}</p>
      <p className="text-sm text-textSecondary mt-0.5">{label}</p>
    </div>
  </div>
);

// ── Status badge ──
const StatusBadge = ({ status }) => {
  const map = {
    confirmed: "badge-success",
    pending: "badge-warning",
    completed: "badge-muted",
    cancelled: "badge-danger",
  };
  return (
    <span className={map[status] || "badge-muted"}>
      {status}
    </span>
  );
};

// ── Custom tooltip for charts ──
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3
                      shadow-xl text-sm">
        <p className="text-textSecondary mb-1 font-medium">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name === "revenue" ? `$${p.value.toLocaleString()}` : p.value}
            <span className="text-textMuted font-normal ml-1 text-xs">
              {p.name}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user, isAdmin, isDoctor, isPatient } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allPatients, setAllPatients] = useState([]);
const [allDoctors,  setAllDoctors]  = useState([]);

useEffect(() => {
  if (isPatient) {
    navigate("/app/patient-dashboard", { replace: true });
  }
  if (isDoctor) {
    navigate("/app/doctor-dashboard", { replace: true });
  }
}, [isPatient, isDoctor, navigate]);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  // Add these helpers inside Dashboard component:
const getPatientNameForDash = (patientId) => {
  const id = parseInt(patientId);

  // Check Patients table records
  const p = allPatients.find((p) => parseInt(p.id) === id);
  if (p) return p.name;

  // Check appointment enriched data
  const appt = appointments.find(
    (a) => parseInt(a.patientId) === id
  );
  if (appt?.patientName) return appt.patientName;

  return `Patient #${patientId}`;
};

const getDoctorNameForDash = (doctorId) => {
  const id = parseInt(doctorId);
  const d  = allDoctors.find((d) => parseInt(d.id) === id);
  return d ? `Dr. ${d.firstName} ${d.lastName}` : `Doctor #${doctorId}`;
};

// Replace fetchDashboardData:
const fetchDashboardData = async () => {
  setLoading(true);
  try {
    if (isAdmin) {
      const [analyticsRes, apptRes, patRes, docRes] =
        await Promise.all([
          doctorAPI.getAnalytics(),
          appointmentAPI.getAll(),
          patientAPI.getAll(),       // ← fetch patients
          doctorAPI.getAll(),        // ← fetch doctors
        ]);
      setStats(analyticsRes.data.data);
      setAppointments(apptRes.data.data?.slice(0, 6) || []);

      // Store patients and doctors for name lookup
      setAllPatients(patRes.data.data  || []);
      setAllDoctors(docRes.data.data   || []);

    } else if (isDoctor) {
      const [statsRes, apptRes] = await Promise.all([
        doctorAPI.getStats(user.id),
        appointmentAPI.getByDoctorDetailed(user.id),
      ]);
      setStats(statsRes.data.data);
      setAppointments(apptRes.data.data?.slice(0, 6) || []);
    } else {
      const apptRes = await appointmentAPI.getByPatient(user.id);
      setAppointments(apptRes.data.data?.slice(0, 6) || []);
    }
  } catch (err) {
    console.error("Dashboard fetch error:", err);
  } finally {
    setLoading(false);
  }
};

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-64 bg-card rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-card rounded-2xl" />
          <div className="h-80 bg-card rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-4">
        <div>
          <p className="text-textSecondary text-sm">{greeting},</p>
          <h1 className="text-3xl font-bold text-textPrimary mt-0.5">
            {isDoctor ? "Dr." : ""} {user?.firstName} {user?.lastName} 👋
          </h1>
          {isAdmin && (
            <p className="text-textSecondary text-sm mt-1">
              System overview — all clinics
            </p>
          )}
        </div>

        {/* Quick action */}
        {(isAdmin || isDoctor) && (
          <Link
            to="/app/diagnosis"
            className="flex items-center gap-2 bg-primary hover:bg-primaryHover
                       text-white font-semibold py-2.5 px-5 rounded-xl
                       transition-colors text-sm flex-shrink-0"
          >
            <Brain size={16} />
            Start AI diagnosis
          </Link>
        )}
      </div>

      {/* ── Stat cards ── */}
      {(isAdmin || isDoctor) && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard icon={Users} label="Total Patients"
            value={stats.totalPatients ?? 0}
            change="12.4%" positive color="#0F766E" bg="#F0FDFA" />

          <StatCard icon={CalendarDays} label="Today's Appts"
            value={stats.pendingAppointments ?? 0}
            change="4.2%" positive color="#6366F1" bg="#EEF2FF" />

          <StatCard icon={TrendingUp} label="Revenue (MTD)"
            value="$12.8k"
            change="18.4%" positive color="#15803D" bg="#DCFCE7" />

          <StatCard icon={UserCheck} label="Doctors"
            value={stats.totalDoctors ?? 1}
            change="2.1%" positive color="#B45309" bg="#FEF3C7" />

          <StatCard icon={Clock} label="Pending"
            value={stats.pendingAppointments ?? 0}
            change="3.4%" positive={false} color="#DC2626" bg="#FEE2E2" />

          <StatCard icon={CheckCircle2} label="Monthly Growth"
            value="18.4%"
            change="6.7%" positive color="#0F766E" bg="#F0FDFA" />
        </div>
      )}

      {/* ── Charts row ── */}
      {(isAdmin || isDoctor) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue & patients chart */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-textPrimary">
                  Revenue & Patients
                </h3>
                <p className="text-xs text-textSecondary mt-0.5">
                  Last 12 months
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-textMuted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                  Patients
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={REVENUE_DATA}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0"
                    x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPatients" x1="0" y1="0"
                    x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="patients"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#colorPatients)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Disease pie chart */}
          <div className="card">
            <div className="mb-6">
              <h3 className="font-semibold text-textPrimary">
                Disease analytics
              </h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Top diagnosis categories
              </p>
            </div>

            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={DISEASE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {DISEASE_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, "Share"]}
                  contentStyle={{
                    background: "#16161f",
                    border: "1px solid #1e1e2e",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-col gap-2 mt-4">
              {DISEASE_DATA.map((d) => (
                <div key={d.name}
                  className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: d.color }} />
                    <span className="text-textSecondary">{d.name}</span>
                  </div>
                  <span className="text-textPrimary font-semibold">
                    {d.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's appointments */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-textPrimary">
                Today's appointments
              </h3>
              <p className="text-xs text-textSecondary mt-0.5">
                {appointments.length} scheduled
              </p>
            </div>
            <Link
              to="/app/appointments"
              className="text-xs text-primary hover:text-primaryHover
                         font-medium transition-colors"
            >
              View all →
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <CalendarDays size={32} className="text-muted" />
              <p className="text-textSecondary text-sm">
                No appointments today
              </p>
              <Link
                to="/app/appointments"
                className="text-xs text-primary hover:underline"
              >
                Book one now →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {appointments.map((appt, idx) => {
                // Build initials from patientId (placeholder since we don't join)
                const initials = `P${appt.patientId ?? idx + 1}`;
                return (
                  <div
                    key={appt.id}
                    className="flex items-center gap-4 py-3 hover:bg-surface/50
                               rounded-xl px-2 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex
                                    items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {initials}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-textPrimary truncate">
                         {appt.patientName || getPatientNameForDash(appt.patientId)} — {appt.reason || "General checkup"}
                      </p>
                      <p className="text-xs text-textMuted truncate">
                        {getDoctorNameForDash(appt.doctorId)} ·{" "}
                        {new Date(appt.date).toLocaleDateString("en-PK", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Time */}
                    <p className="text-xs text-textMuted flex-shrink-0">
                      {new Date(appt.date).toLocaleTimeString("en-PK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    {/* Status */}
                    <StatusBadge status={appt.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="card">
          <div className="mb-5">
            <h3 className="font-semibold text-textPrimary">Activity</h3>
            <p className="text-xs text-textSecondary mt-0.5">
              Live across your clinic
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {ACTIVITY_FEED.map((item) => (
              <div key={item.id} className="flex gap-3">
                {/* Dot */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0
                                pt-1">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="w-px flex-1 bg-border min-h-[16px]" />
                </div>

                {/* Content */}
                <div className="pb-4 min-w-0">
                  <p className="text-sm font-medium text-textPrimary leading-snug">
                    {item.title}
                  </p>
                  <p className="text-xs text-textMuted mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                  <p className="text-xs text-textMuted mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI promo banner ── */}
      {isDoctor && (
        <div className="card relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg,#F0FDFA 0%,#EEF2FF 100%)",
            border: "1px solid #CCFBF1",
          }}>
          <div className="absolute right-6 top-1/2 -translate-y-1/2
                    opacity-5">
            <Brain size={100} style={{ color: "#0F766E" }} />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row
                    sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={14} style={{ color: "#0F766E" }} />
                <span className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: "#0F766E" }}>
                  AI Powered
                </span>
              </div>
              <h3 className="font-bold text-textPrimary text-lg">
                Smart Symptom Checker
              </h3>
              <p className="text-sm text-textSecondary mt-1">
                Enter symptoms and get instant risk assessment,
                possible conditions and suggested tests.
              </p>
            </div>
            <a href="/app/diagnosis"
              className="btn-primary !w-auto px-6 flex-shrink-0">
              <Stethoscope size={15} />
              Try now
            </a>
          </div>
        </div>
      )}
    </div>
  );
}