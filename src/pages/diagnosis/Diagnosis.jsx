import { useState, useEffect } from "react";
import { aiAPI, patientAPI } from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  Brain, Stethoscope, AlertTriangle,
  CheckCircle2, Clock, ChevronDown,
  Sparkles, User, FileText, X,
  Activity, Shield, FlaskConical,
  TrendingUp, History, Zap,
} from "lucide-react";

// ── Risk level config ──
const RISK_CONFIG = {
  low: {
    label:  "Low Risk",
    color:  "#15803D",
    bg:     "#DCFCE7",
    border: "#BBF7D0",
    icon:   CheckCircle2,
  },
  medium: {
    label:  "Medium Risk",
    color:  "#B45309",
    bg:     "#FEF3C7",
    border: "#FDE68A",
    icon:   AlertTriangle,
  },
  high: {
    label:  "High Risk",
    color:  "#DC2626",
    bg:     "#FEE2E2",
    border: "#FECACA",
    icon:   AlertTriangle,
  },
};

// ── Urgency config ──
const URGENCY_CONFIG = {
  routine:   { label: "Routine",   color: "#475569", bg: "#F1F5F9" },
  urgent:    { label: "Urgent",    color: "#B45309", bg: "#FEF3C7" },
  emergency: { label: "Emergency", color: "#DC2626", bg: "#FEE2E2" },
};

// ── Risk meter visual ──
const RiskMeter = ({ level }) => {
  const levels  = ["low", "medium", "high"];
  const current = levels.indexOf(level);
  const colors  = ["#22C55E", "#F59E0B", "#EF4444"];
  const widths  = ["33%", "66%", "100%"];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs
                      text-textMuted">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden"
           style={{ background: "#E2E8F0" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width:      widths[current],
            background: `linear-gradient(90deg, #22C55E, ${colors[current]})`,
          }}
        />
      </div>
    </div>
  );
};

// ── Symptom tag ──
const SymptomTag = ({ symptom, onRemove }) => (
  <span
    className="inline-flex items-center gap-1.5 px-3 py-1.5
               rounded-xl text-xs font-medium"
    style={{ background: "#F0FDFA", color: "#0F766E",
             border: "1px solid #CCFBF1" }}
  >
    {symptom}
    {onRemove && (
      <button onClick={onRemove}
              className="hover:opacity-70 transition-opacity">
        <X size={10} />
      </button>
    )}
  </span>
);

export default function Diagnosis() {
  const { user, isPro } = useAuth();

  const [patients,      setPatients]      = useState([]);
  const [logs,          setLogs]          = useState([]);
  const [activeTab,     setActiveTab]     = useState("checker");
  const [loading,       setLoading]       = useState(false);
  const [logsLoading,   setLogsLoading]   = useState(true);
  const [result,        setResult]        = useState(null);
  const [riskResult,    setRiskResult]    = useState(null);
  const [error,         setError]         = useState("");

  // ── Symptom checker form ──
  const [form, setForm] = useState({
    patientId: "",
    symptoms:  "",
    age:       "",
    gender:    "",
    history:   "",
  });

  // ── Risk flagging form ──
  const [riskForm, setRiskForm] = useState({
    currentSymptoms: "",
    patientAge:      "",
    patientGender:   "",
    diagnosisHistory: "",
  });

  // ── Symptom tags ──
  const [symptomInput, setSymptomInput] = useState("");
  const [symptomTags,  setSymptomTags]  = useState([]);

  useEffect(() => {
    fetchPatients();
    fetchLogs();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await patientAPI.getAll();
      setPatients(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await aiAPI.getLogs();
      setLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  // ── Add symptom tag on Enter or comma ──
  const handleSymptomKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = symptomInput.trim().replace(/,$/, "");
      if (val && !symptomTags.includes(val)) {
        setSymptomTags((prev) => [...prev, val]);
      }
      setSymptomInput("");
    }
  };

  const removeSymptomTag = (tag) => {
    setSymptomTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleFormChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRiskFormChange = (e) => {
    setError("");
    setRiskForm((prev) => ({
      ...prev, [e.target.name]: e.target.value,
    }));
  };

  // ── When patient is selected, auto-fill age/gender ──
  const handlePatientSelect = (e) => {
    const id      = e.target.value;
    const patient = patients.find((p) => String(p.id) === String(id));
    setForm((prev) => ({
      ...prev,
      patientId: id,
      age:       patient?.age      || prev.age,
      gender:    patient?.gender   || prev.gender,
      history:   patient?.history  || prev.history,
    }));
  };

  // ── Submit symptom checker ──
  const handleSymptomSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const symptomsText = symptomTags.length > 0
      ? symptomTags.join(", ")
      : form.symptoms;

    if (!symptomsText || !form.age || !form.gender) {
      setError("Symptoms, age and gender are required");
      return;
    }

    setLoading(true);
    try {
      const res = await aiAPI.symptomChecker({
        symptoms:  symptomsText,
        age:       parseInt(form.age),
        gender:    form.gender,
        history:   form.history,
        patientId: form.patientId ? String(form.patientId) : null,
      });
      setResult(res.data.data);
      fetchLogs();
    } catch (err) {
      setError(
        err.response?.data?.message || "AI analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Submit risk flagging ──
  const handleRiskSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setRiskResult(null);

    if (!riskForm.currentSymptoms) {
      setError("Current symptoms are required");
      return;
    }

    setLoading(true);
    try {
      let history = [];
      if (riskForm.diagnosisHistory.trim()) {
        history = riskForm.diagnosisHistory
          .split("\n")
          .filter(Boolean)
          .map((h) => ({ condition: h.trim() }));
      }

      const res = await aiAPI.riskFlagging({
        currentSymptoms: riskForm.currentSymptoms,
        patientAge:      riskForm.patientAge
          ? parseInt(riskForm.patientAge) : null,
        patientGender:   riskForm.patientGender,
        diagnosisHistory: history,
      });
      setRiskResult(res.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Risk analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { key: "checker", label: "Symptom Checker", icon: Stethoscope },
    { key: "risk",    label: "Risk Flagging",   icon: Shield       },
    { key: "history", label: "Diagnosis Logs",  icon: History      },
  ];

  // ── Pro gate ──
  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center
                      py-20 gap-6">
        <div className="w-20 h-20 rounded-3xl flex items-center
                        justify-center"
             style={{
               background: "linear-gradient(135deg,#F0FDFA,#EEF2FF)",
               border:     "1px solid #CCFBF1",
             }}>
          <Brain size={36} style={{ color: "#6366F1" }} />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-textPrimary">
            AI Diagnosis requires Pro
          </h2>
          <p className="text-textSecondary text-sm mt-2 leading-relaxed">
            Upgrade to the Pro plan to unlock Smart Symptom Checker,
            Risk Flagging, and AI-powered analytics.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <div className="flex flex-col gap-2">
            {[
              "Smart Symptom Checker",
              "Risk Flagging & Alerts",
              "AI Prescription Explanation",
              "Predictive Analytics",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm
                                      text-textSecondary">
                <CheckCircle2 size={14} style={{ color: "#0F766E" }} />
                {f}
              </div>
            ))}
          </div>
          <a href="/app/settings"
             className="btn-primary mt-2">
            <Sparkles size={16} />
            Upgrade to Pro
          </a>
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
          <div className="flex items-center gap-2 mb-1">
            <h1 className="page-title">AI Diagnosis</h1>
            <span className="badge-ai flex items-center gap-1">
              <Sparkles size={10} />
              {/* Powered by Gemini */}
            </span>
          </div>
          <p className="page-subtitle">
            Smart symptom analysis and risk assessment
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
           style={{ background: "#F1F5F9",
                    border: "1px solid #E2E8F0" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setError("");
                setResult(null);
                setRiskResult(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg
                         text-sm font-medium transition-all duration-200"
              style={
                activeTab === tab.key
                  ? {
                      background: "#FFFFFF",
                      color:      "#0F172A",
                      boxShadow:  "0 1px 3px rgba(0,0,0,0.08)",
                    }
                  : { color: "#64748B" }
              }
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────── */}
      {/* TAB 1 — SYMPTOM CHECKER            */}
      {/* ─────────────────────────────────── */}
      {activeTab === "checker" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Form ── */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center
                              justify-center"
                   style={{ background: "#EEF2FF" }}>
                <Stethoscope size={20} style={{ color: "#6366F1" }} />
              </div>
              <div>
                <h3 className="font-bold text-textPrimary">
                  Symptom Checker
                </h3>
                <p className="text-xs text-textMuted">
                  Enter symptoms to get AI analysis
                </p>
              </div>
            </div>

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

            <form onSubmit={handleSymptomSubmit}
                  className="flex flex-col gap-4">

              {/* Patient select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-textSecondary">
                  Patient (optional)
                </label>
                <div className="relative">
                  <User size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2
                                   text-textMuted pointer-events-none" />
                  <select
                    value={form.patientId}
                    onChange={handlePatientSelect}
                    className="input !pl-9"
                  >
                    <option value="">Select to auto-fill</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Age + Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-textSecondary">
                    Age <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleFormChange}
                    placeholder="e.g. 35"
                    min="1" max="120"
                    className="input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-textSecondary">
                    Gender <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleFormChange}
                    className="input"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Symptoms tags input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-textSecondary">
                  Symptoms <span style={{ color: "#EF4444" }}>*</span>
                </label>

                {/* Tags display */}
                {symptomTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {symptomTags.map((tag) => (
                      <SymptomTag
                        key={tag}
                        symptom={tag}
                        onRemove={() => removeSymptomTag(tag)}
                      />
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  onKeyDown={handleSymptomKeyDown}
                  placeholder="Type symptom and press Enter
                    (e.g. chest pain, fever)"
                  className="input"
                />
                <p className="text-xs text-textMuted">
                  Press Enter after each symptom to add as tag
                </p>

                {/* OR free text */}
                {symptomTags.length === 0 && (
                  <textarea
                    name="symptoms"
                    value={form.symptoms}
                    onChange={handleFormChange}
                    placeholder="Or describe symptoms in detail..."
                    rows={3}
                    className="input resize-none mt-1"
                  />
                )}
              </div>

              {/* Medical history */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-textSecondary">
                  Medical History
                </label>
                <textarea
                  name="history"
                  value={form.history}
                  onChange={handleFormChange}
                  placeholder="Previous conditions, medications, allergies..."
                  rows={2}
                  className="input resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40
                                     border-t-white rounded-full
                                     animate-spin" />
                    Analyzing symptoms...
                  </>
                ) : (
                  <>
                    <Brain size={16} />
                    Analyze with AI
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ── Result panel ── */}
          <div className="flex flex-col gap-4">
            {!result && !loading && (
              <div className="card flex flex-col items-center
                              justify-center py-16 gap-4 h-full
                              min-h-64">
                <div className="w-16 h-16 rounded-2xl flex items-center
                                justify-center"
                     style={{ background: "#F8FAFC",
                              border: "1px solid #E2E8F0" }}>
                  <Brain size={28} style={{ color: "#94A3B8" }} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-textSecondary">
                    AI results will appear here
                  </p>
                  <p className="text-xs text-textMuted mt-1">
                    Fill in the form and click Analyze
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="card flex flex-col items-center
                              justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center
                                justify-center"
                     style={{
                       background: "linear-gradient(135deg,#EEF2FF,#F0FDFA)",
                     }}>
                  <Brain size={28} style={{ color: "#6366F1" }}
                         className="animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-textPrimary">
                    Analyzing symptoms...
                  </p>
                  <p className="text-xs text-textMuted mt-1">
                    Gemini AI is processing your request
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        background:      "#6366F1",
                        animationDelay:  `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {result && !loading && (
              <DiagnosisResult result={result} />
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────── */}
      {/* TAB 2 — RISK FLAGGING              */}
      {/* ─────────────────────────────────── */}
      {activeTab === "risk" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Form */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center
                              justify-center"
                   style={{ background: "#FEF3C7" }}>
                <Shield size={20} style={{ color: "#B45309" }} />
              </div>
              <div>
                <h3 className="font-bold text-textPrimary">
                  Risk Flagging
                </h3>
                <p className="text-xs text-textMuted">
                  Identify high-risk patterns in patient history
                </p>
              </div>
            </div>

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

            <form onSubmit={handleRiskSubmit}
                  className="flex flex-col gap-4">

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-textSecondary">
                    Patient Age
                  </label>
                  <input
                    type="number"
                    name="patientAge"
                    value={riskForm.patientAge}
                    onChange={handleRiskFormChange}
                    placeholder="e.g. 55"
                    className="input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-textSecondary">
                    Gender
                  </label>
                  <select
                    name="patientGender"
                    value={riskForm.patientGender}
                    onChange={handleRiskFormChange}
                    className="input"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-textSecondary">
                  Current Symptoms{" "}
                  <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  name="currentSymptoms"
                  value={riskForm.currentSymptoms}
                  onChange={handleRiskFormChange}
                  placeholder="Describe current symptoms in detail..."
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-textSecondary">
                  Past Diagnosis History
                </label>
                <textarea
                  name="diagnosisHistory"
                  value={riskForm.diagnosisHistory}
                  onChange={handleRiskFormChange}
                  placeholder="One condition per line&#10;e.g. Hypertension 2019&#10;Diabetes 2021"
                  rows={4}
                  className="input resize-none"
                />
                <p className="text-xs text-textMuted">
                  Enter one past condition per line
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  background: loading
                    ? undefined
                    : "linear-gradient(135deg,#B45309,#DC2626)",
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40
                                     border-t-white rounded-full
                                     animate-spin" />
                    Analyzing risks...
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    Run Risk Analysis
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Risk result */}
          <div>
            {!riskResult && !loading && (
              <div className="card flex flex-col items-center
                              justify-center py-16 gap-4 h-full
                              min-h-64">
                <div className="w-16 h-16 rounded-2xl flex items-center
                                justify-center"
                     style={{ background: "#FEF3C7",
                              border: "1px solid #FDE68A" }}>
                  <Shield size={28} style={{ color: "#B45309" }} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-textSecondary">
                    Risk assessment will appear here
                  </p>
                  <p className="text-xs text-textMuted mt-1">
                    Fill in the form and run analysis
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="card flex flex-col items-center
                              justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center
                                justify-center animate-pulse"
                     style={{ background: "#FEF3C7" }}>
                  <Shield size={28} style={{ color: "#B45309" }} />
                </div>
                <p className="font-semibold text-textPrimary">
                  Running risk analysis...
                </p>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        background:      "#F59E0B",
                        animationDelay:  `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {riskResult && !loading && (
              <RiskResult result={riskResult} />
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────── */}
      {/* TAB 3 — DIAGNOSIS LOGS             */}
      {/* ─────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-textSecondary">
              {logs.length} diagnosis log{logs.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={fetchLogs}
              className="btn-secondary !w-auto gap-2 text-xs !py-2"
            >
              <Activity size={13} />
              Refresh
            </button>
          </div>

          {logsLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card h-24 animate-pulse"
                     style={{ background: "#E2E8F0" }} />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="card flex flex-col items-center
                            justify-center py-16 gap-4">
              <History size={32} style={{ color: "#94A3B8" }} />
              <p className="text-textSecondary text-sm">
                No diagnosis logs yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {logs.map((log) => {
                const risk   = RISK_CONFIG[log.riskLevel] || RISK_CONFIG.low;
                const RIcon  = risk.icon;
                let parsed   = null;
                try {
                  parsed = JSON.parse(log.aiResponse);
                } catch {
                  parsed = null;
                }

                return (
                  <div key={log.id} className="card">
                    <div className="flex items-start justify-between
                                    gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center
                                        justify-center flex-shrink-0"
                             style={{ background: risk.bg }}>
                          <RIcon size={16}
                                 style={{ color: risk.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold
                                        text-textPrimary">
                            Diagnosis Log #{log.id}
                          </p>
                          <p className="text-xs text-textMuted">
                            Patient #{log.patientId || "N/A"} ·{" "}
                            {new Date(log.createdAt).toLocaleDateString(
                              "en-PK",
                              { day: "numeric", month: "short",
                                year: "numeric" }
                            )}
                          </p>
                        </div>
                      </div>

                      <span
                        className="text-xs font-semibold px-2.5 py-1
                                   rounded-full flex-shrink-0"
                        style={{
                          background: risk.bg,
                          color:      risk.color,
                          border:     `1px solid ${risk.border}`,
                        }}
                      >
                        {risk.label}
                      </span>
                    </div>

                    {/* Symptoms */}
                    <div className="mb-3">
                      <p className="text-xs text-textMuted mb-1.5
                                    font-medium uppercase tracking-wide">
                        Symptoms
                      </p>
                      <p className="text-sm text-textSecondary
                                    leading-relaxed">
                        {log.symptoms}
                      </p>
                    </div>

                    {/* Conditions from parsed response */}
                    {parsed?.possibleConditions && (
                      <div>
                        <p className="text-xs text-textMuted mb-1.5
                                      font-medium uppercase tracking-wide">
                          Possible Conditions
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {parsed.possibleConditions.map((c, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-1 rounded-lg
                                         font-medium"
                              style={{
                                background: "#EEF2FF",
                                color:      "#4F46E5",
                              }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// DIAGNOSIS RESULT COMPONENT
// ─────────────────────────────────────────────
function DiagnosisResult({ result }) {
  const { logId, result: data, usedFallback } = result;
  if (!data) return null;

  const risk    = RISK_CONFIG[data.riskLevel]  || RISK_CONFIG.low;
  const urgency = URGENCY_CONFIG[data.urgency] || URGENCY_CONFIG.routine;
  const RIcon   = risk.icon;

  return (
    <div className="flex flex-col gap-4">

      {/* Fallback notice */}
      {usedFallback && (
        <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
             style={{ background: "#FEF3C7",
                      border: "1px solid #FDE68A",
                      color: "#B45309" }}>
          <AlertTriangle size={14} />
          AI service unavailable — showing fallback analysis
        </div>
      )}

      {/* Risk level card */}
      <div className="card"
           style={{
             background: risk.bg,
             border:     `1px solid ${risk.border}`,
           }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center
                            justify-center"
                 style={{ background: "#FFFFFF40" }}>
              <RIcon size={20} style={{ color: risk.color }} />
            </div>
            <div>
              <p className="font-bold text-textPrimary">
                {risk.label}
              </p>
              <p className="text-xs" style={{ color: risk.color }}>
                Log ID #{logId}
              </p>
            </div>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: urgency.bg, color: urgency.color }}
          >
            {urgency.label}
          </span>
        </div>
        <RiskMeter level={data.riskLevel} />
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={15} style={{ color: "#6366F1" }} />
            <p className="text-sm font-semibold text-textPrimary">
              Clinical Summary
            </p>
          </div>
          <p className="text-sm text-textSecondary leading-relaxed">
            {data.summary}
          </p>
        </div>
      )}

      {/* Possible conditions */}
      {data.possibleConditions?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={15} style={{ color: "#0F766E" }} />
            <p className="text-sm font-semibold text-textPrimary">
              Possible Conditions
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {data.possibleConditions.map((condition, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "#F8FAFC",
                         border: "1px solid #E2E8F0" }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center
                             justify-center text-xs font-bold
                             flex-shrink-0"
                  style={{ background: "#CCFBF1", color: "#0F766E" }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-textPrimary font-medium">
                  {condition}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested tests */}
      {data.suggestedTests?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={15} style={{ color: "#A855F7" }} />
            <p className="text-sm font-semibold text-textPrimary">
              Suggested Tests
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.suggestedTests.map((test, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1.5 rounded-xl font-medium"
                style={{ background: "#FAF5FF",
                         color: "#7E22CE",
                         border: "1px solid #E9D5FF" }}
              >
                {test}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// RISK RESULT COMPONENT
// ─────────────────────────────────────────────
function RiskResult({ result }) {
  const risk  = RISK_CONFIG[result.overallRisk] || RISK_CONFIG.low;
  const RIcon = risk.icon;

  return (
    <div className="flex flex-col gap-4">

      {/* Overall risk */}
      <div className="card"
           style={{
             background: risk.bg,
             border:     `1px solid ${risk.border}`,
           }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center
                          justify-center"
               style={{ background: "#FFFFFF40" }}>
            <RIcon size={20} style={{ color: risk.color }} />
          </div>
          <div>
            <p className="font-bold text-textPrimary">
              Overall Risk: {risk.label}
            </p>
            <p className="text-xs text-textSecondary">
              AI risk assessment complete
            </p>
          </div>
        </div>
        <RiskMeter level={result.overallRisk} />

        {/* Flags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {result.chronicRisk && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "#FEE2E2", color: "#DC2626" }}>
              Chronic Risk Detected
            </span>
          )}
          {result.repeatedInfections && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "#FEF3C7", color: "#B45309" }}>
              Repeated Infections
            </span>
          )}
        </div>
      </div>

      {/* Alert message */}
      {result.alertMessage && (
        <div className="px-4 py-3 rounded-xl text-sm flex items-center
                        gap-2 font-medium"
             style={{ background: "#FEE2E2",
                      border: "1px solid #FECACA",
                      color: "#DC2626" }}>
          <AlertTriangle size={14} />
          {result.alertMessage}
        </div>
      )}

      {/* Risk flags */}
      {result.riskFlags?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} style={{ color: "#B45309" }} />
            <p className="text-sm font-semibold text-textPrimary">
              Risk Flags
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {result.riskFlags.map((flag, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "#FEF3C7",
                         border: "1px solid #FDE68A" }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: "#B45309" }} />
                <span className="text-sm text-textSecondary">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} style={{ color: "#0F766E" }} />
            <p className="text-sm font-semibold text-textPrimary">
              Recommendations
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {result.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "#F0FDFA",
                         border: "1px solid #CCFBF1" }}
              >
                <CheckCircle2
                  size={15}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "#0F766E" }}
                />
                <span className="text-sm text-textSecondary">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}