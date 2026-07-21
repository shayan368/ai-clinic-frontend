import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { doctorAPI, appointmentAPI, aiAPI } from "../../api/axios.js";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Users, CalendarDays, TrendingUp, UserCheck,
  Brain, Sparkles, ArrowUpRight, Stethoscope,
  Activity, Award, Clock, FileText,
} from "lucide-react";

// ── Demo trend data ──
const APPOINTMENT_TREND = [
  { month: "Jan", appointments: 45, completed: 38 },
  { month: "Feb", appointments: 52, completed: 47 },
  { month: "Mar", appointments: 48, completed: 41 },
  { month: "Apr", appointments: 61, completed: 55 },
  { month: "May", appointments: 55, completed: 49 },
  { month: "Jun", appointments: 73, completed: 65 },
];

const RISK_DISTRIBUTION = [
  { name: "Low Risk",    value: 58, color: "#22C55E" },
  { name: "Medium Risk", value: 28, color: "#F59E0B" },
  { name: "High Risk",   value: 14, color: "#EF4444" },
];

const DOCTOR_PERFORMANCE = [
  { name: "Dr. Imran", patients: 42, prescriptions: 38 },
  { name: "Dr. Sara",  patients: 35, prescriptions: 31 },
];

const WEEKLY_VISITS = [
  { day: "Mon", visits: 12 },
  { day: "Tue", visits: 19 },
  { day: "Wed", visits: 15 },
  { day: "Thu", visits: 22 },
  { day: "Fri", visits: 18 },
  { day: "Sat", visits: 9  },
  { day: "Sun", visits: 4  },
];

// ── Stat card ──
const StatCard = ({ icon: Icon, label, value, change, positive,
                    color, bg }) => (
  <div className="card flex flex-col gap-4 hover:shadow-cardHover
                  hover:-translate-y-0.5 transition-all duration-200">
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 rounded-xl flex items-center
                      justify-center"
           style={{ background: bg }}>
        <Icon size={18} style={{ color }} />
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-xs font-medium
                         ${positive ? "text-success" : "text-danger"}`}>
          <ArrowUpRight size={12}
                        className={positive ? "" : "rotate-180"} />
          {change}
        </div>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold text-textPrimary">{value}</p>
      <p className="text-sm text-textSecondary mt-0.5">{label}</p>
    </div>
  </div>
);

// ── Custom tooltip ──
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-border rounded-xl
                      px-4 py-3 shadow-card text-sm">
        <p className="text-textSecondary mb-1 font-medium">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color || p.fill }}
             className="font-semibold">
            {p.value}
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

export default function Analytics() {
  const { user, isAdmin, isDoctor, isPro } = useAuth();

  const [analytics,    setAnalytics]    = useState(null);
  const [doctorStats,  setDoctorStats]  = useState(null);
  const [aiInsights,   setAiInsights]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [aiLoading,    setAiLoading]    = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res = await doctorAPI.getAnalytics();
        setAnalytics(res.data.data);
      } else if (isDoctor) {
        const res = await doctorAPI.getStats(user.id);
        setDoctorStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictiveAnalytics = async () => {
    setAiLoading(true);
    try {
      const res = await aiAPI.predictiveAnalytics({
        month: new Date().toLocaleString("en-PK", { month: "long" }),
        year:  new Date().getFullYear(),
        diagnosisLogs:   [],
        appointmentData: APPOINTMENT_TREND,
      });
      setAiInsights(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 rounded-xl"
             style={{ background: "#E2E8F0" }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl"
                 style={{ background: "#E2E8F0" }} />
          ))}
        </div>
        <div className="h-80 rounded-2xl"
             style={{ background: "#E2E8F0" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">
            {isAdmin
              ? "Full clinic performance overview"
              : "Your personal performance metrics"}
          </p>
        </div>

        {isAdmin && isPro && (
          <button
            onClick={handlePredictiveAnalytics}
            disabled={aiLoading}
            className="btn-primary !w-auto px-5"
          >
            {aiLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40
                                 border-t-white rounded-full
                                 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                AI Predictive Insights
              </>
            )}
          </button>
        )}
      </div>

      {/* ── Admin stat cards ── */}
      {isAdmin && analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}        label="Total Patients"
            value={analytics.totalPatients}
            change="12.4%" positive color="#0F766E" bg="#F0FDFA" />
          <StatCard icon={UserCheck}    label="Total Doctors"
            value={analytics.totalDoctors}
            change="2.1%"  positive color="#6366F1" bg="#EEF2FF" />
          <StatCard icon={CalendarDays} label="Total Appointments"
            value={analytics.totalAppointments}
            change="18.4%" positive color="#15803D" bg="#DCFCE7" />
          <StatCard icon={FileText}     label="Prescriptions"
            value={analytics.totalPrescriptions}
            change="9.7%"  positive color="#B45309" bg="#FEF3C7" />
        </div>
      )}

      {/* ── Doctor stat cards ── */}
      {isDoctor && doctorStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={CalendarDays} label="Total Appointments"
            value={doctorStats.totalAppointments}
            color="#0F766E" bg="#F0FDFA" />
          <StatCard icon={Clock}        label="Pending"
            value={doctorStats.pendingAppointments}
            color="#B45309" bg="#FEF3C7" />
          <StatCard icon={Activity}     label="Completed"
            value={doctorStats.completedAppointments}
            color="#15803D" bg="#DCFCE7" />
          <StatCard icon={FileText}     label="Prescriptions Written"
            value={doctorStats.totalPrescriptions}
            color="#6366F1" bg="#EEF2FF" />
        </div>
      )}

      {/* ── AI Predictive Insights ── */}
      {aiInsights && (
        <div className="card"
             style={{
               background: "linear-gradient(135deg,#F0FDFA,#EEF2FF)",
               border:     "1px solid #CCFBF1",
             }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} style={{ color: "#6366F1" }} />
            <h3 className="font-bold text-textPrimary">
              AI Predictive Insights
            </h3>
            <span className="badge-ai">This month</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white">
              <p className="text-xs text-textMuted uppercase
                            tracking-wide mb-1.5 font-semibold">
                Most Common Diagnosis
              </p>
              <p className="text-sm font-semibold text-textPrimary">
                {aiInsights.mostCommonDisease}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white">
              <p className="text-xs text-textMuted uppercase
                            tracking-wide mb-1.5 font-semibold">
                Patient Load Forecast
              </p>
              <p className="text-sm font-semibold text-textPrimary">
                {aiInsights.patientLoadForecast}
              </p>
            </div>
          </div>

          {aiInsights.trends?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-textMuted uppercase
                            tracking-wide mb-2 font-semibold">
                Key Trends
              </p>
              <div className="flex flex-col gap-2">
                {aiInsights.trends.map((trend, i) => (
                  <div key={i}
                       className="flex items-center gap-2 p-3
                                  rounded-xl bg-white text-sm
                                  text-textSecondary">
                    <TrendingUp size={13}
                                style={{ color: "#0F766E" }} />
                    {trend}
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiInsights.recommendations?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-textMuted uppercase
                            tracking-wide mb-2 font-semibold">
                Recommendations
              </p>
              <div className="flex flex-col gap-2">
                {aiInsights.recommendations.map((rec, i) => (
                  <div key={i}
                       className="flex items-start gap-2 p-3
                                  rounded-xl bg-white text-sm
                                  text-textSecondary">
                    <Award size={13} className="flex-shrink-0 mt-0.5"
                           style={{ color: "#A855F7" }} />
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Charts grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Appointment trend */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-textPrimary">
                Appointment Trends
              </h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Last 6 months
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-textMuted">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full"
                      style={{ background: "#0F766E" }} />
                Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full"
                      style={{ background: "#6366F1" }} />
                Completed
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={APPOINTMENT_TREND}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAppt" x1="0" y1="0"
                                x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0F766E"
                        stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0F766E"
                        stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0"
                                x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366F1"
                        stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366F1"
                        stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month"
                     tick={{ fill: "#94A3B8", fontSize: 11 }}
                     axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }}
                     axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="appointments"
                    stroke="#0F766E" strokeWidth={2}
                    fill="url(#colorAppt)" name="Booked" />
              <Area type="monotone" dataKey="completed"
                    stroke="#6366F1" strokeWidth={2}
                    fill="url(#colorCompleted)" name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk distribution */}
        <div className="card">
          <div className="mb-6">
            <h3 className="font-semibold text-textPrimary">
              AI Risk Distribution
            </h3>
            <p className="text-xs text-textSecondary mt-0.5">
              Across all diagnoses
            </p>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={RISK_DISTRIBUTION}
                cx="50%" cy="50%"
                innerRadius={45} outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {RISK_DISTRIBUTION.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}%`, "Share"]}
                contentStyle={{
                  background:   "#FFFFFF",
                  border:       "1px solid #E2E8F0",
                  borderRadius: "12px",
                  fontSize:     "12px",
                  boxShadow:    "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col gap-2 mt-4">
            {RISK_DISTRIBUTION.map((d) => (
              <div key={d.name}
                   className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full
                                   flex-shrink-0"
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

      {/* ── Bottom charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Weekly visits */}
        <div className="card">
          <div className="mb-6">
            <h3 className="font-semibold text-textPrimary">
              Weekly Visits
            </h3>
            <p className="text-xs text-textSecondary mt-0.5">
              This week's appointment volume
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WEEKLY_VISITS}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day"
                     tick={{ fill: "#94A3B8", fontSize: 11 }}
                     axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }}
                     axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="visits" name="Visits"
                   fill="#14B8A6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Doctor performance — admin only */}
        {isAdmin && (
          <div className="card">
            <div className="mb-6">
              <h3 className="font-semibold text-textPrimary">
                Doctor Performance
              </h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Patients seen vs prescriptions written
              </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={DOCTOR_PERFORMANCE}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name"
                       tick={{ fill: "#94A3B8", fontSize: 11 }}
                       axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }}
                       axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="patients" name="Patients"
                     fill="#0F766E" radius={[8, 8, 0, 0]} />
                <Bar dataKey="prescriptions" name="Prescriptions"
                     fill="#A855F7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Doctor's own trend if not admin */}
        {!isAdmin && (
          <div className="card">
            <div className="mb-6">
              <h3 className="font-semibold text-textPrimary">
                Your Monthly Trend
              </h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Appointments handled over time
              </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={APPOINTMENT_TREND}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month"
                       tick={{ fill: "#94A3B8", fontSize: 11 }}
                       axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }}
                       axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="completed"
                      stroke="#0F766E" strokeWidth={2.5}
                      dot={{ fill: "#0F766E", r: 4 }}
                      name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Pro upsell for free users ── */}
      {!isPro && isAdmin && (
        <div className="card flex flex-col sm:flex-row sm:items-center
                        gap-4"
             style={{
               background: "linear-gradient(135deg,#F0FDFA,#EEF2FF)",
               border:     "1px solid #CCFBF1",
             }}>
          <div className="w-12 h-12 rounded-xl flex items-center
                          justify-center flex-shrink-0"
               style={{ background: "#FFFFFF" }}>
            <Sparkles size={22} style={{ color: "#6366F1" }} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-textPrimary">
              Unlock AI Predictive Insights
            </h3>
            <p className="text-sm text-textSecondary mt-1">
              Get monthly disease forecasts, patient load predictions
              and doctor performance trends powered by AI.
            </p>
          </div>
          <a href="/app/settings" className="btn-primary !w-auto px-6
                                              flex-shrink-0">
            Upgrade to Pro
          </a>
        </div>
      )}
    </div>
  );
}