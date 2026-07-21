import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Eye, EyeOff, Activity, Check } from "lucide-react";

// ── Role option card ──
const RoleCard = ({ value, label, description, icon, selected, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`flex flex-col gap-1 p-4 rounded-xl border text-left
                transition-all duration-200 cursor-pointer
                ${selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-textSecondary hover:border-muted"
                }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-lg">{icon}</span>
      {selected && (
        <div className="w-4 h-4 bg-primary rounded-full flex items-center
                        justify-center">
          <Check size={10} className="text-white" />
        </div>
      )}
    </div>
    <span className="text-sm font-semibold text-textPrimary mt-1">
      {label}
    </span>
    <span className="text-xs text-textMuted leading-relaxed">
      {description}
    </span>
  </button>
);

const ROLES = [
  {
    value:       "doctor",
    label:       "Doctor",
    icon:        "🩺",
    description: "Access patients, write prescriptions, use AI diagnosis",
  },
  {
    value:       "receptionist",
    label:       "Receptionist",
    icon:        "📋",
    description: "Register patients, book and manage appointments",
  },
  {
    value:       "patient",
    label:       "Patient",
    icon:        "🏥",
    description: "View your appointments, prescriptions and history",
  },
  {
    value:       "admin",
    label:       "Admin",
    icon:        "⚙️",
    description: "Full system access, analytics and user management",
  },
];

// ── Input field style ──
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-textSecondary">
      {label}
      {required && <span className="text-danger ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export default function Register() {
  const navigate     = useNavigate();
  const { register } = useAuth();

  const [step,     setStep]     = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const [formData, setFormData] = useState({
    // ── Account fields ──
    firstName:      "",
    lastName:       "",
    email:          "",
    password:       "",
    role:           "",
    specialization: "",
    phone:          "",
    // ── Patient medical fields (only shown if role === "patient") ──
    age:            "",
    gender:         "",
    contact:        "",
    bloodGroup:     "",
    address:        "",
  });

  const handleChange = (e) => {
    setError("");
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleNext = () => {
    if (!formData.role) {
      setError("Please select a role to continue");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { firstName, lastName, email, password } = formData;

    if (!firstName || !lastName || !email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate("/app/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isPatient = formData.role === "patient";

  return (
    <div className="min-h-screen bg-background flex items-center
                    justify-center px-6 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center
                          justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-textPrimary">Lifecare</span>
        </div>

        {/* Card */}
        <div className="card">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="text-textMuted hover:text-textSecondary
                             transition-colors text-sm"
                >
                  ← Back
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <div className={`w-2 h-2 rounded-full transition-colors
                  ${step >= 1 ? "bg-primary" : "bg-border"}`} />
                <div className={`w-2 h-2 rounded-full transition-colors
                  ${step >= 2 ? "bg-primary" : "bg-border"}`} />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-textPrimary">
              {step === 1 ? "Create your account" : "Your details"}
            </h1>
            <p className="text-textSecondary text-sm mt-1">
              {step === 1
                ? "Choose your role to get started."
                : "Fill in your information below."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-danger/10 border border-danger/20
                            rounded-xl text-danger text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-danger rounded-full flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── STEP 1: Role selection ── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((role) => (
                  <RoleCard
                    key={role.value}
                    {...role}
                    selected={formData.role === role.value}
                    onClick={handleRoleSelect}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="btn-primary mt-2"
              >
                Continue
              </button>

              <p className="text-center text-sm text-textSecondary">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:text-primaryHover
                             font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: User details ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* ── Section: Account Info ── */}
              <div className="flex flex-col gap-4">

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" required>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      className="input"
                    />
                  </Field>
                  <Field label="Last name" required>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Smith"
                      className="input"
                    />
                  </Field>
                </div>

                {/* Email */}
                <Field label="Email" required>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@clinic.com"
                    className="input"
                  />
                </Field>

                {/* Phone */}
                <Field label="Phone">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+92 300 0000000"
                    className="input"
                  />
                </Field>

                {/* Specialization — doctors only */}
                {formData.role === "doctor" && (
                  <Field label="Specialization">
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Cardiology, General Practice"
                      className="input"
                    />
                  </Field>
                )}

                {/* Password */}
                <Field label="Password" required>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 6 characters"
                      className="input pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2
                                 text-textMuted hover:text-textSecondary
                                 transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Password strength */}
                  {formData.password && (
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            formData.password.length >= level * 2
                              ? level <= 1
                                ? "bg-danger"
                                : level <= 2
                                ? "bg-warning"
                                : level <= 3
                                ? "bg-primary"
                                : "bg-success"
                              : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </Field>
              </div>

              {/* ── Patient medical fields ── */}
              {isPatient && (
                <div className="flex flex-col gap-4">

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-textMuted font-medium
                                     uppercase tracking-wide">
                      Medical Information
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Age + Gender */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Age">
                      <input
                        type="number"
                        name="age"
                        min="0"
                        max="120"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="e.g. 28"
                        className="input"
                      />
                    </Field>
                    <Field label="Gender">
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="input"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                  </div>

                  {/* Contact + Blood Group */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Contact Number">
                      <input
                        type="tel"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        placeholder="+92 300 0000000"
                        className="input"
                      />
                    </Field>
                    <Field label="Blood Group">
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        className="input"
                      >
                        <option value="">Select</option>
                        {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Address */}
                  <Field label="Address">
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. House 12, Street 4, Lahore"
                      className="input"
                    />
                  </Field>

                  {/* Info note */}
                  <div className="px-4 py-3 rounded-xl text-xs
                                  text-textSecondary leading-relaxed"
                       style={{ background: "#F0FDFA",
                                border: "1px solid #CCFBF1" }}>
                    ℹ️ This medical information helps doctors provide
                    better care. You can update it anytime from your
                    profile settings.
                  </div>
                </div>
              )}

              {/* Selected role display */}
              <div className="flex items-center gap-2 px-4 py-3 bg-primary/5
                              border border-primary/20 rounded-xl">
                <span className="text-primary text-sm font-medium">
                  Role:
                </span>
                <span className="text-textSecondary text-sm capitalize">
                  {formData.role}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-xs text-primary hover:underline"
                >
                  Change
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
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>

              <p className="text-center text-sm text-textSecondary">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:text-primaryHover
                             font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}