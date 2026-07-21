
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { prescriptionAPI, doctorAPI } from "../../api/axios.js";
import {
  FileText, Download, Pill, Eye, X,
} from "lucide-react";

// Patient sees their own prescriptions
export default function PatientPrescriptions() {
  const { user }      = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [doctors,       setDoctors]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [viewData,      setViewData]      = useState(null);
  const [downloading,   setDownloading]   = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Find patient record linked to this user
      const [presRes, docRes] = await Promise.all([
        prescriptionAPI.getByPatient(user.id),
        doctorAPI.getAll(),
      ]);
      setPrescriptions(presRes.data.data || []);
      setDoctors(docRes.data.data        || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDoctorName = (id) => {
    const d = doctors.find((d) => d.id === id);
    return d ? `Dr. ${d.firstName} ${d.lastName}` : `Doctor #${id}`;
  };

  const handleDownload = async (id) => {
    setDownloading(id);
    try {
      const res  = await prescriptionAPI.download(id);
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `prescription_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card h-32"
               style={{ background: "#E2E8F0" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="page-title">My Prescriptions</h1>
        <p className="page-subtitle">
          {prescriptions.length} prescription
          {prescriptions.length !== 1 ? "s" : ""} issued
        </p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="card flex flex-col items-center
                        justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center
                          justify-center"
               style={{ background: "#F0FDFA" }}>
            <FileText size={28} style={{ color: "#0F766E" }} />
          </div>
          <p className="text-textSecondary text-sm">
            No prescriptions yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {prescriptions.map((pres) => {
            const medicines = Array.isArray(pres.medicines)
              ? pres.medicines : [];

            return (
              <div key={pres.id} className="card">

                {/* Header */}
                <div className="flex items-start justify-between
                                gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-textPrimary">
                      Prescription #{pres.id}
                    </p>
                    <p className="text-xs text-textMuted mt-0.5">
                      {getDoctorName(pres.doctorId)} ·{" "}
                      {new Date(pres.createdAt).toLocaleDateString(
                        "en-PK",
                        { year: "numeric", month: "short",
                          day: "numeric" }
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={
                      pres.status === "active"    ? "badge-success"
                      : pres.status === "completed" ? "badge-muted"
                      : "badge-danger"
                    }>
                      {pres.status}
                    </span>
                  </div>
                </div>

                {/* Medicines */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {medicines.map((med, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5
                                 px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: "#F0FDFA", color: "#0F766E",
                               border: "1px solid #CCFBF1" }}
                    >
                      <Pill size={11} />
                      {med.name}
                      {med.dosage && (
                        <span style={{ color: "#64748B" }}>
                          · {med.dosage}
                        </span>
                      )}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3"
                     style={{ borderTop: "1px solid #E2E8F0" }}>
                  <button
                    onClick={() => setViewData(pres)}
                    className="btn-secondary flex-1 !text-sm !py-2"
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                  <button
                    onClick={() => handleDownload(pres.id)}
                    disabled={downloading === pres.id}
                    className="btn-primary flex-1 !text-sm !py-2"
                  >
                    {downloading === pres.id ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2
                                         border-white/40 border-t-white
                                         rounded-full animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Download PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View modal */}
      {viewData && (
        <div className="fixed inset-0 z-50 flex items-center
                        justify-center p-4"
             style={{ background: "rgba(15,23,42,0.5)",
                      backdropFilter: "blur(4px)" }}>
          <div className="card w-full max-w-md
                          max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-textPrimary">
                Prescription #{viewData.id}
              </h3>
              <button
                onClick={() => setViewData(null)}
                className="btn-ghost !p-2 !w-auto"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-textMuted uppercase
                              tracking-wide mb-2 font-semibold">
                  Medicines
                </p>
                {(Array.isArray(viewData.medicines)
                  ? viewData.medicines : []).map((med, i) => (
                  <div key={i} className="flex items-center gap-3
                                          p-3 rounded-xl mb-2"
                       style={{ background: "#F8FAFC",
                                border: "1px solid #E2E8F0" }}>
                    <Pill size={14} style={{ color: "#0F766E" }} />
                    <div>
                      <p className="text-sm font-medium text-textPrimary">
                        {med.name} {med.dosage && `— ${med.dosage}`}
                      </p>
                      <p className="text-xs text-textMuted">
                        {med.frequency} · {med.duration}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {viewData.instructions && (
                <div className="p-3 rounded-xl"
                     style={{ background: "#FFFBEB",
                              border: "1px solid #FDE68A" }}>
                  <p className="text-xs text-textMuted uppercase
                                tracking-wide mb-1 font-semibold">
                    Instructions
                  </p>
                  <p className="text-sm text-textSecondary">
                    {viewData.instructions}
                  </p>
                </div>
              )}

              {viewData.aiExplanation && (
                <div className="p-3 rounded-xl"
                     style={{ background: "#EEF2FF",
                              border: "1px solid #C7D2FE" }}>
                  <p className="text-xs uppercase tracking-wide mb-1
                                font-semibold"
                     style={{ color: "#6366F1" }}>
                    ✨ AI Explanation
                  </p>
                  <p className="text-sm text-textSecondary leading-relaxed
                                whitespace-pre-line">
                    {viewData.aiExplanation}
                  </p>
                </div>
              )}

              <button
                onClick={() => handleDownload(viewData.id)}
                disabled={downloading === viewData.id}
                className="btn-primary"
              >
                <Download size={15} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}