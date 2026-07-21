import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { authAPI } from "../../api/axios.js";
import {
  User, Lock, Crown, Bell, Shield,
  Mail, Phone, Stethoscope, Save,
  CheckCircle2, Sparkles, AlertTriangle,
  Eye, EyeOff,
} from "lucide-react";

const TABS = [
  { key: "profile",      label: "Profile",      icon: User    },
  { key: "security",     label: "Security",     icon: Lock    },
  { key: "subscription", label: "Subscription", icon: Crown   },
];

export default function Settings() {
  const { user, updateUser, isPro } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── Sidebar tabs ── */}
        <div className="lg:col-span-1">
          <div className="card !p-2 flex lg:flex-col gap-1
                          overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-3 px-4 py-3
                             rounded-xl text-sm font-medium
                             transition-all duration-200 whitespace-nowrap
                             flex-shrink-0"
                  style={
                    activeTab === tab.key
                      ? { background: "#F0FDFA", color: "#0F766E" }
                      : { color: "#475569" }
                  }
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Pro badge card */}
          {isPro && (
            <div className="card mt-4"
                 style={{
                   background:
                     "linear-gradient(135deg,#F0FDFA,#EEF2FF)",
                   border: "1px solid #CCFBF1",
                 }}>
              <div className="flex items-center gap-2 mb-2">
                <Crown size={16} style={{ color: "#F59E0B" }} />
                <span className="text-sm font-bold text-textPrimary">
                  Pro Plan Active
                </span>
              </div>
              <p className="text-xs text-textSecondary">
                You have access to all AI features and advanced analytics.
              </p>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <ProfileTab user={user} updateUser={updateUser} />
          )}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "subscription" && (
            <SubscriptionTab user={user} isPro={isPro}
                             updateUser={updateUser} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────────
function ProfileTab({ user, updateUser }) {
  const [form, setForm] = useState({
    firstName:      user?.firstName      || "",
    lastName:       user?.lastName       || "",
    phone:          user?.phone          || "",
    specialization: user?.specialization || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const handleChange = (e) => {
    setError("");
    setSuccess(false);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`
    .toUpperCase();

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center
                        justify-center"
             style={{ background: "#F0FDFA" }}>
          <User size={20} style={{ color: "#0F766E" }} />
        </div>
        <div>
          <h3 className="font-bold text-textPrimary">
            Profile Information
          </h3>
          <p className="text-xs text-textMuted">
            Update your personal details
          </p>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6 pb-6"
           style={{ borderBottom: "1px solid #E2E8F0" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center
                        justify-center text-xl font-bold"
             style={{
               background:
                 "linear-gradient(135deg,#0F766E30,#6366F130)",
               color: "#0F766E",
             }}>
          {initials}
        </div>
        <div>
          <p className="font-semibold text-textPrimary">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-textMuted capitalize">
            {user?.role}
          </p>
        </div>
      </div>

      {/* Success */}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm
                        flex items-center gap-2"
             style={{ background: "#DCFCE7",
                      border: "1px solid #BBF7D0",
                      color: "#15803D" }}>
          <CheckCircle2 size={14} />
          Profile updated successfully
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm
                        flex items-center gap-2"
             style={{ background: "#FEE2E2",
                      border: "1px solid #FECACA",
                      color: "#DC2626" }}>
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              First Name
            </label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Last Name
            </label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        {/* Email — read only */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-textSecondary">
            Email
          </label>
          <div className="relative">
            <Mail size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2
                             text-textMuted" />
            <input
              value={user?.email || ""}
              disabled
              className="input !pl-9 opacity-60 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-textSecondary">
            Phone
          </label>
          <div className="relative">
            <Phone size={15}
                   className="absolute left-3 top-1/2 -translate-y-1/2
                              text-textMuted" />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+92 300 0000000"
              className="input !pl-9"
            />
          </div>
        </div>

        {/* Specialization — doctors only */}
        {user?.role === "doctor" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Specialization
            </label>
            <div className="relative">
              <Stethoscope
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2
                           text-textMuted" />
              <input
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                placeholder="e.g. Cardiology"
                className="input !pl-9"
              />
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
                className="btn-primary !w-auto px-6 mt-2">
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40
                               border-t-white rounded-full
                               animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={15} />
              Save Changes
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECURITY TAB
// ─────────────────────────────────────────────
function SecurityTab() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");

  const handleChange = (e) => {
    setError("");
    setSuccess(false);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleShow = (field) =>
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center
                        justify-center"
             style={{ background: "#EEF2FF" }}>
          <Lock size={20} style={{ color: "#6366F1" }} />
        </div>
        <div>
          <h3 className="font-bold text-textPrimary">
            Change Password
          </h3>
          <p className="text-xs text-textMuted">
            Keep your account secure
          </p>
        </div>
      </div>

      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm
                        flex items-center gap-2"
             style={{ background: "#DCFCE7",
                      border: "1px solid #BBF7D0",
                      color: "#15803D" }}>
          <CheckCircle2 size={14} />
          Password changed successfully
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm
                        flex items-center gap-2"
             style={{ background: "#FEE2E2",
                      border: "1px solid #FECACA",
                      color: "#DC2626" }}>
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4
                                                max-w-md">
        {[
          { name: "currentPassword", label: "Current Password" },
          { name: "newPassword",     label: "New Password" },
          { name: "confirmPassword", label: "Confirm New Password" },
        ].map((field) => (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              {field.label}
            </label>
            <div className="relative">
              <input
                type={showPass[field.name] ? "text" : "password"}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                placeholder="••••••••"
                className="input !pr-12"
              />
              <button
                type="button"
                onClick={() => toggleShow(field.name)}
                className="absolute right-4 top-1/2 -translate-y-1/2
                           text-textMuted hover:text-textSecondary"
              >
                {showPass[field.name]
                  ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        ))}

        <button type="submit" disabled={loading}
                className="btn-primary !w-auto px-6 mt-2">
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40
                               border-t-white rounded-full
                               animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Shield size={15} />
              Update Password
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUBSCRIPTION TAB
// ─────────────────────────────────────────────
function SubscriptionTab({ user, isPro, updateUser }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async (plan) => {
    setLoading(true);
    try {
      const res = await authAPI.upgradePlan({ plan });
      updateUser(res.data.data);
      localStorage.setItem("token", res.data.token);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const PLANS = [
    {
      key:      "free",
      name:     "Free",
      price:    "$0",
      period:   "forever",
      features: [
        "Up to 50 patients",
        "Basic appointment scheduling",
        "Standard prescriptions",
        "No AI features",
      ],
      color: "#64748B",
      bg:    "#F8FAFC",
    },
    {
      key:      "pro",
      name:     "Pro",
      price:    "$49",
      period:   "per month",
      features: [
        "Unlimited patients",
        "AI Symptom Checker",
        "Risk Flagging & Alerts",
        "AI Prescription Explanation",
        "Predictive Analytics",
        "Priority support",
      ],
      color: "#0F766E",
      bg:    "linear-gradient(135deg,#F0FDFA,#EEF2FF)",
      popular: true,
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      {success && (
        <div className="px-4 py-3 rounded-xl text-sm
                        flex items-center gap-2"
             style={{ background: "#DCFCE7",
                      border: "1px solid #BBF7D0",
                      color: "#15803D" }}>
          <CheckCircle2 size={14} />
          Subscription plan updated successfully
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = user?.subscriptionPlan === plan.key;

          return (
            <div
              key={plan.key}
              className="card relative flex flex-col"
              style={{
                background: plan.bg,
                border: plan.popular
                  ? "2px solid #0F766E"
                  : "1px solid #E2E8F0",
              }}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 px-3 py-1
                                 rounded-full text-xs font-bold
                                 text-white flex items-center gap-1"
                      style={{
                        background:
                          "linear-gradient(135deg,#0F766E,#6366F1)",
                      }}>
                  <Sparkles size={10} />
                  POPULAR
                </span>
              )}

              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-textPrimary">
                  {plan.name}
                </h3>
                {isCurrent && (
                  <span className="badge-primary">Current</span>
                )}
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-textPrimary">
                  {plan.price}
                </span>
                <span className="text-sm text-textMuted">
                  /{plan.period}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2
                                          text-sm text-textSecondary">
                    <CheckCircle2 size={14}
                                  style={{ color: plan.color }} />
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan.key)}
                disabled={isCurrent || loading}
                className={isCurrent ? "btn-secondary" : "btn-primary"}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40
                                   border-t-white rounded-full
                                   animate-spin" />
                ) : isCurrent ? (
                  "Current Plan"
                ) : plan.key === "pro" ? (
                  "Upgrade to Pro"
                ) : (
                  "Downgrade to Free"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <div className="card !p-4 flex items-center gap-3"
           style={{ background: "#FFFBEB",
                    border: "1px solid #FDE68A" }}>
        <AlertTriangle size={16} style={{ color: "#B45309" }}
                       className="flex-shrink-0" />
        <p className="text-xs text-textSecondary">
          This is a simulated subscription for demo purposes.
          No real payment is processed.
        </p>
      </div>
    </div>
  );
}