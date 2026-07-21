import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Eye, EyeOff, Activity } from "lucide-react";

// ── Vital card shown on left panel ──
const VitalCard = ({ label, value, unit }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex
                  flex-col gap-1 backdrop-blur-sm">
    <span className="text-xs text-textMuted uppercase tracking-wide">{label}</span>
    <span className="text-xl font-bold text-textPrimary">
      {value}
      <span className="text-xs font-normal text-textSecondary ml-1">{unit}</span>
    </span>
  </div>
);

export default function Login() {
  const navigate     = useNavigate();
  const { login }    = useAuth();

  const [formData, setFormData]   = useState({ email: "", password: "" });
  const [showPass,  setShowPass]  = useState(false);
  const [remember,  setRemember]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  // ── Input change ──
  const handleChange = (e) => {
    setError("");
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/app/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between
                      p-12 overflow-hidden">

        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20
                        via-accent/10 to-background" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10
                        rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/10
                        rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center
                          justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-textPrimary">Lifecare</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-8">

          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10
                            border border-primary/20 rounded-full px-4 py-1.5
                            text-xs text-primary font-medium mb-6">
              <span className="w-1.5 h-1.5 bg-primary rounded-full
                               animate-pulse" />
              Smart Diagnosis 2.0
            </div>

            <h2 className="text-3xl font-bold text-textPrimary leading-snug">
              One workspace for<br />
              your entire clinic.
            </h2>
            <p className="text-textSecondary mt-3 text-sm leading-relaxed max-w-sm">
              From walk-in to follow-up, Lifecare keeps your team
              focused on care — not paperwork.
            </p>
          </div>

          {/* Patient vitals card */}
          <div className="bg-card border border-border rounded-2xl p-5 max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center
                              justify-center text-sm font-bold text-primary">
                ET
              </div>
              <div>
                <p className="text-sm font-semibold text-textPrimary">
                  Ali Khan
                </p>
                <p className="text-xs text-textMuted">Cardiology · Routine</p>
              </div>
              <span className="ml-auto badge-success">Stable</span>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <VitalCard label="BP"   value="118/76" unit="mmHg" />
              <VitalCard label="HR"   value="72"     unit="bpm"  />
              <VitalCard label="SpO₂" value="98"     unit="%"    />
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-textMuted">
          © 2026 Lifecare Clinic OS. Crafted with care.
        </p>
      </div>

      {/* ── RIGHT PANEL — LOGIN FORM ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center
                      px-6 py-12">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center
                          justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-textPrimary">Lifecare</span>
        </div>

        <div className="w-full max-w-md">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-textPrimary">
              Welcome back
            </h1>
            <p className="text-textSecondary text-sm mt-2">
              Sign in to continue to your clinic workspace.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-danger/10 border border-danger/20
                            rounded-xl text-danger text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-danger rounded-full flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-textSecondary">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="doctor@clinic.com"
                className="input"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-textSecondary">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                             text-textMuted hover:text-textSecondary transition-colors"
                >
                  {showPass
                    ? <EyeOff size={16} />
                    : <Eye size={16} />
                  }
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-surface
                             accent-primary cursor-pointer"
                />
                <span className="text-sm text-textSecondary">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-primary hover:text-primaryHover
                           transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30
                                   border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-textMuted">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-secondary py-3 text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26
                     1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92
                     3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23
                     1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99
                     20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43
                     8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09
                     14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6
                     3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button className="btn-secondary py-3 text-sm">
              <svg className="w-4 h-4 text-textPrimary" fill="currentColor"
                   viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079
                         3.158 9.417 7.618 11.162-.105-.949-.2-2.405.042-3.441.218-.937
                         1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914
                         2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655
                         2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0
                         3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414
                         0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36
                         0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698
                         -2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262
                         4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227
                         7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271
                         1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009
                         12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007
                         5.367 18.641.001 12.017.001z" />
              </svg>
              Apple
            </button>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-textSecondary mt-8">
            New here?{" "}
            <Link
              to="/register"
              className="text-primary hover:text-primaryHover
                         font-medium transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}