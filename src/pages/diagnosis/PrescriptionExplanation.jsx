import { useState } from "react";
import { prescriptionAPI, aiAPI } from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  Sparkles, FileText, Globe, Loader,
  AlertTriangle, CheckCircle2, Pill,
} from "lucide-react";

export default function PrescriptionExplanation() {
  const { isPro } = useAuth();

  const [prescriptionId, setPrescriptionId] = useState("");
  const [language,       setLanguage]       = useState("english");
  const [explanation,    setExplanation]    = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [medicines,      setMedicines]      = useState([]);
  const [instructions,   setInstructions]   = useState("");
  const [fetching,       setFetching]       = useState(false);

  // ── Fetch prescription details first ──
  const handleFetchPrescription = async () => {
    if (!prescriptionId) return;
    setFetching(true);
    setError("");
    setExplanation("");
    try {
      const res = await prescriptionAPI.getOne(prescriptionId);
      const p   = res.data.data;
      setMedicines(Array.isArray(p.medicines) ? p.medicines : []);
      setInstructions(p.instructions || "");
    } catch (err) {
      setError("Prescription not found. Check the ID and try again.");
    } finally {
      setFetching(false);
    }
  };

  const handleExplain = async () => {
    if (medicines.length === 0) {
      setError("Please load a prescription first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await aiAPI.prescriptionExplanation({
        medicines,
        instructions,
        language,
        prescriptionId: prescriptionId
          ? parseInt(prescriptionId) : null,
      });
      setExplanation(res.data.data.explanation);
    } catch (err) {
      setError(
        err.response?.data?.message || "AI explanation failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="page-title">Prescription Explanation</h1>
        <p className="page-subtitle">
          Generate patient-friendly AI explanations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Input panel ── */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center
                            justify-center"
                 style={{ background: "#EEF2FF" }}>
              <Sparkles size={20} style={{ color: "#6366F1" }} />
            </div>
            <div>
              <h3 className="font-bold text-textPrimary">
                AI Explanation Generator
              </h3>
              <p className="text-xs text-textMuted">
                Makes prescriptions easy to understand
              </p>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm
                            flex items-center gap-2"
                 style={{ background: "#FEE2E2",
                          border: "1px solid #FECACA",
                          color: "#DC2626" }}>
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {/* Prescription ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Prescription ID
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={prescriptionId}
                onChange={(e) => {
                  setPrescriptionId(e.target.value);
                  setMedicines([]);
                  setExplanation("");
                }}
                placeholder="Enter prescription ID"
                className="input flex-1"
              />
              <button
                onClick={handleFetchPrescription}
                disabled={!prescriptionId || fetching}
                className="btn-secondary !w-auto px-4 flex-shrink-0"
              >
                {fetching ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  "Load"
                )}
              </button>
            </div>
          </div>

          {/* Loaded medicines */}
          {medicines.length > 0 && (
            <div className="p-4 rounded-xl flex flex-col gap-2"
                 style={{ background: "#F8FAFC",
                          border: "1px solid #E2E8F0" }}>
              <p className="text-xs font-semibold text-textMuted
                            uppercase tracking-wide mb-1">
                Loaded Medicines
              </p>
              {medicines.map((med, i) => (
                <div key={i}
                     className="flex items-center gap-2 text-sm">
                  <Pill size={12} style={{ color: "#0F766E" }} />
                  <span className="font-medium text-textPrimary">
                    {med.name}
                  </span>
                  <span className="text-textMuted text-xs">
                    {med.dosage} · {med.frequency}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 mt-1 text-xs
                              text-success font-medium">
                <CheckCircle2 size={12} />
                Prescription loaded successfully
              </div>
            </div>
          )}

          {/* Language */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-textSecondary">
              Explanation Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["english", "urdu"].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className="flex items-center justify-center gap-2
                             py-3 rounded-xl text-sm font-medium
                             transition-all duration-200 capitalize"
                  style={
                    language === lang
                      ? {
                          background:
                            "linear-gradient(135deg,#0F766E,#6366F1)",
                          color: "#FFFFFF",
                        }
                      : {
                          background: "#F8FAFC",
                          color:      "#475569",
                          border:     "1px solid #E2E8F0",
                        }
                  }
                >
                  <Globe size={14} />
                  {lang === "urdu" ? "اردو" : "English"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExplain}
            disabled={loading || medicines.length === 0}
            className="btn-primary"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40
                                 border-t-white rounded-full animate-spin" />
                Generating explanation...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate AI Explanation
              </>
            )}
          </button>
        </div>

        {/* ── Output panel ── */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} style={{ color: "#6366F1" }} />
            <h3 className="font-bold text-textPrimary">
              Patient Explanation
            </h3>
            {explanation && (
              <span className="badge-ai ml-auto flex items-center gap-1">
                <Sparkles size={10} />
                AI Generated
              </span>
            )}
          </div>

          {!explanation && !loading && (
            <div className="flex flex-col items-center justify-center
                            py-16 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center
                              justify-center"
                   style={{ background: "#EEF2FF",
                            border: "1px solid #C7D2FE" }}>
                <Sparkles size={28} style={{ color: "#6366F1" }} />
              </div>
              <div className="text-center">
                <p className="font-medium text-textSecondary">
                  AI explanation will appear here
                </p>
                <p className="text-xs text-textMuted mt-1">
                  Load a prescription and click Generate
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center
                            py-16 gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center
                              justify-center animate-pulse"
                   style={{ background: "#EEF2FF" }}>
                <Sparkles size={22} style={{ color: "#6366F1" }} />
              </div>
              <p className="text-textSecondary text-sm font-medium">
                Generating patient-friendly explanation...
              </p>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{
                      background:     "#6366F1",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {explanation && (
            <div className="p-4 rounded-xl text-sm text-textSecondary
                            leading-relaxed whitespace-pre-line"
                 style={{ background: "#F8FAFC",
                          border: "1px solid #E2E8F0" }}>
              {explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}