import { useState, useEffect } from "react";
import { appointmentAPI, doctorAPI } from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  X, ChevronLeft, ChevronRight,
  Stethoscope, Clock, Calendar,
  User, FileText, CheckCircle2,
  AlertTriangle, Loader,
} from "lucide-react";

// ─── style tokens ───
const s = {
  overlay: {
    position:       "fixed",
    inset:          0,
    zIndex:         60,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    padding:        "16px",
    background:     "rgba(15,23,42,0.55)",
    backdropFilter: "blur(4px)",
    overflowY:      "auto",
  },
  modal: {
    background:   "#FFFFFF",
    borderRadius: "20px",
    border:       "1px solid #E2E8F0",
    padding:      "0",
    width:        "100%",
    maxWidth:     "580px",
    boxShadow:    "0 20px 60px rgba(0,0,0,0.18)",
    margin:       "auto",
    overflow:     "hidden",
  },
  header: {
    padding:         "20px 24px 16px",
    borderBottom:    "1px solid #E2E8F0",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "space-between",
    background:      "linear-gradient(135deg,#F0FDFA,#EEF2FF)",
  },
  body: {
    padding:   "24px",
    maxHeight: "70vh",
    overflowY: "auto",
  },
  input: {
    width:        "100%",
    padding:      "10px 14px",
    border:       "1px solid #E2E8F0",
    borderRadius: "10px",
    fontSize:     "14px",
    color:        "#0F172A",
    background:   "#F8FAFC",
    outline:      "none",
    boxSizing:    "border-box",
    transition:   "border-color 0.2s",
  },
  label: {
    fontSize:      "12px",
    fontWeight:    600,
    color:         "#64748B",
    display:       "block",
    marginBottom:  "6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  btn: {
    display:        "inline-flex",
    alignItems:     "center",
    gap:            "8px",
    padding:        "11px 22px",
    borderRadius:   "10px",
    fontSize:       "14px",
    fontWeight:     600,
    cursor:         "pointer",
    border:         "none",
    background:     "linear-gradient(135deg,#0F766E,#6366F1)",
    color:          "#FFFFFF",
    transition:     "all 0.2s",
  },
  btnSec: {
    display:      "inline-flex",
    alignItems:   "center",
    gap:          "8px",
    padding:      "10px 20px",
    borderRadius: "10px",
    fontSize:     "14px",
    fontWeight:   500,
    cursor:       "pointer",
    border:       "1px solid #E2E8F0",
    background:   "#FFFFFF",
    color:        "#475569",
  },
};

// ── departments derived from doctor specializations ──
const DEPARTMENTS = [
  "All Doctors",
  "Cardiology",
  "General Practice",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Dermatology",
  "ENT",
  "Gynecology",
  "Psychiatry",
  "Ophthalmology",
];

// ── Step indicator ──
const Steps = ({ current }) => {
  const steps = [
    { n: 1, label: "Doctor"    },
    { n: 2, label: "Date/Time" },
    { n: 3, label: "Details"   },
    { n: 4, label: "Confirm"   },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center",
                  gap: "0", marginBottom: "24px" }}>
      {steps.map((step, i) => (
        <div key={step.n} style={{ display: "flex",
                                   alignItems: "center", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column",
                        alignItems: "center", flex: "none" }}>
            <div style={{
              width:          "32px",
              height:         "32px",
              borderRadius:   "50%",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       "13px",
              fontWeight:     700,
              background:     current >= step.n
                ? "linear-gradient(135deg,#0F766E,#6366F1)"
                : "#F1F5F9",
              color:          current >= step.n ? "#FFFFFF" : "#94A3B8",
              transition:     "all 0.3s",
            }}>
              {current > step.n
                ? <CheckCircle2 size={16} />
                : step.n}
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600,
                           color:    current >= step.n
                             ? "#0F766E" : "#94A3B8",
                           marginTop: "4px",
                           textTransform: "uppercase",
                           letterSpacing: "0.04em" }}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex:       1,
              height:     "2px",
              margin:     "0 4px",
              marginBottom: "16px",
              background: current > step.n ? "#0F766E" : "#E2E8F0",
              transition: "background 0.3s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
};

// ── Calendar picker ──
const CalendarPicker = ({ selectedDate, onSelect, doctorId }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const today      = new Date();
  today.setHours(0, 0, 0, 0);

  const year       = currentMonth.getFullYear();
  const month      = currentMonth.getMonth();
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth= new Date(year, month + 1, 0).getDate();

  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const prevMonth = () =>
    setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(year, month + 1, 1));

  const toDateStr = (day) => {
    const d = new Date(year, month, day);
    return d.toISOString().split("T")[0];
  };

  const isPast = (day) => {
    const d = new Date(year, month, day);
    d.setHours(0,0,0,0);
    return d < today;
  };

  const isWeekend = (day) => {
    const d = new Date(year, month, day);
    return d.getDay() === 0 || d.getDay() === 6;
  };

  return (
    <div style={{ userSelect: "none" }}>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px" }}>
        <button onClick={prevMonth} style={{
          ...s.btnSec, padding: "6px 10px", fontSize: "12px",
        }}>
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontSize: "15px", fontWeight: 600,
                       color: "#0F172A" }}>
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} style={{
          ...s.btnSec, padding: "6px 10px", fontSize: "12px",
        }}>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)",
                    gap: "2px", marginBottom: "4px" }}>
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: "center",
                                fontSize: "11px", fontWeight: 600,
                                color: "#94A3B8", padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: "grid",
                    gridTemplateColumns: "repeat(7,1fr)",
                    gap: "2px" }}>
        {[...Array(firstDay)].map((_, i) => (
          <div key={`e-${i}`} />
        ))}
        {[...Array(daysInMonth)].map((_, i) => {
          const day     = i + 1;
          const dateStr = toDateStr(day);
          const past    = isPast(day);
          const weekend = isWeekend(day);
          const selected= selectedDate === dateStr;
          const disabled= past || weekend;

          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => !disabled && onSelect(dateStr)}
              style={{
                padding:        "8px 4px",
                borderRadius:   "8px",
                border:         "none",
                fontSize:       "13px",
                fontWeight:     selected ? 700 : 400,
                cursor:         disabled ? "not-allowed" : "pointer",
                background:     selected
                  ? "linear-gradient(135deg,#0F766E,#6366F1)"
                  : disabled ? "transparent" : "#F8FAFC",
                color:          selected ? "#FFFFFF"
                  : disabled ? "#CBD5E1" : "#0F172A",
                opacity:        disabled ? 0.5 : 1,
                transition:     "all 0.15s",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: "11px", color: "#94A3B8",
                  marginTop: "10px", textAlign: "center" }}>
        Weekends and past dates are unavailable
      </p>
    </div>
  );
};

// ── Time slot picker ──
const SlotPicker = ({ doctorId, date, selectedSlot, onSelect }) => {
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!doctorId || !date) return;
    fetchSlots();
  }, [doctorId, date]);

  const fetchSlots = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await appointmentAPI.getSlots(doctorId, date);
      setSlots(res.data.data || []);
    } catch (err) {
      setError("Could not load time slots. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <Loader size={20} color="#0F766E"
                style={{ animation: "spin 0.8s linear infinite",
                         margin: "0 auto" }} />
        <p style={{ color: "#94A3B8", fontSize: "13px",
                    marginTop: "8px" }}>
          Loading available slots...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "12px 16px", background: "#FEE2E2",
                    borderRadius: "10px", color: "#DC2626",
                    fontSize: "13px" }}>
        {error}
      </div>
    );
  }

  const available = slots.filter((s) => s.available);
  const morning   = slots.filter((s) => {
    const h = parseInt(s.time.split(":")[0]);
    return h < 13;
  });
  const afternoon = slots.filter((s) => {
    const h = parseInt(s.time.split(":")[0]);
    return h >= 13;
  });

  return (
    <div>
      {available.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center",
                      background: "#FEF3C7", borderRadius: "12px",
                      border: "1px solid #FDE68A" }}>
          <AlertTriangle size={24} color="#B45309"
                         style={{ marginBottom: "8px" }} />
          <p style={{ color: "#B45309", fontSize: "14px",
                      fontWeight: 500, margin: 0 }}>
            No available slots on this date
          </p>
          <p style={{ color: "#92400E", fontSize: "12px",
                      marginTop: "4px" }}>
            Please choose another date
          </p>
        </div>
      ) : (
        <>
          {[
            { label: "Morning", slots: morning },
            { label: "Afternoon", slots: afternoon },
          ].map(({ label, slots: group }) => (
            group.length > 0 && (
              <div key={label} style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600,
                            color: "#64748B", textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            marginBottom: "8px" }}>
                  {label}
                </p>
                <div style={{ display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fill,minmax(90px,1fr))",
                              gap: "8px" }}>
                  {group.map((slot) => {
                    const isSelected = selectedSlot === slot.time;
                    return (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() =>
                          slot.available && onSelect(slot.time)
                        }
                        style={{
                          padding:      "10px 8px",
                          borderRadius: "10px",
                          fontSize:     "13px",
                          fontWeight:   isSelected ? 600 : 400,
                          cursor:       slot.available
                            ? "pointer" : "not-allowed",
                          border:       isSelected
                            ? "2px solid #0F766E"
                            : "1px solid #E2E8F0",
                          background:   isSelected
                            ? "linear-gradient(135deg,#F0FDFA,#EEF2FF)"
                            : slot.available ? "#FFFFFF" : "#F8FAFC",
                          color:        isSelected ? "#0F766E"
                            : slot.available ? "#0F172A" : "#CBD5E1",
                          opacity:      slot.available ? 1 : 0.5,
                          transition:   "all 0.15s",
                        }}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────
export default function BookAppointmentModal({ onClose, onSaved }) {
  const { user } = useAuth();

  const [step,         setStep]         = useState(1);
  const [doctors,      setDoctors]      = useState([]);
  const [department,   setDepartment]   = useState("All Doctors");
  const [selectedDoc,  setSelectedDoc]  = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason,       setReason]       = useState("");
  const [symptoms,     setSymptoms]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [fetchingDocs, setFetchingDocs] = useState(true);
  const [error,        setError]        = useState("");
  const [toast,        setToast]        = useState("");

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
  setFetchingDocs(true);
  setError("");
  try {
    const res = await doctorAPI.getAll();
    const list = res.data.data || [];
    if (list.length === 0) {
      setError(
        "No doctors are registered yet. " +
        "Please contact the clinic admin."
      );
    }
    setDoctors(list);
  } catch (err) {
    // ── Show specific error from backend ──
    const msg = err.response?.data?.message;
    if (err.response?.status === 403) {
      setError(
        "Access denied. Please log out and log back in."
      );
    } else {
      setError(
        msg || "Could not load doctors. Please close and try again."
      );
    }
    console.error("fetchDoctors error:", err.response || err);
  } finally {
    setFetchingDocs(false);
  }
};
  // ── Filtered doctors ──
  const filteredDocs = department === "All Doctors"
    ? doctors
    : doctors.filter((d) =>
        (d.specialization || "General Practice")
          .toLowerCase()
          .includes(department.toLowerCase())
      );

  // ── Available departments from actual doctors ──
  const availableDepts = [
    "All Doctors",
    ...new Set(
      doctors.map((d) => d.specialization || "General Practice")
    ),
  ];

  // ── Build final appointment datetime ──
  const buildDateTime = () => {
    if (!selectedDate || !selectedSlot) return null;
    return new Date(`${selectedDate}T${selectedSlot}:00.000Z`);
  };

  // ── Validate each step ──
  const validateStep = () => {
    setError("");
    if (step === 1 && !selectedDoc) {
      setError("Please select a doctor to continue");
      return false;
    }
    if (step === 2) {
      if (!selectedDate) {
        setError("Please select a date");
        return false;
      }
      if (!selectedSlot) {
        setError("Please select a time slot");
        return false;
      }
    }
    if (step === 3 && !reason.trim()) {
      setError("Please enter the reason for your visit");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
  };

  // ── Submit booking ──
  const handleBook = async () => {
    if (!validateStep()) return;
    const dateTime = buildDateTime();
    if (!dateTime) {
      setError("Invalid date or time");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await appointmentAPI.create({
        patientId: user.id,
        doctorId:  selectedDoc.id,
        date:      dateTime.toISOString(),
        status:    "pending",
        reason:    reason.trim(),
        symptoms:  symptoms.trim(),
      });

      // ── Show success toast ──
      showToast("Appointment booked successfully! 🎉");
      setTimeout(() => {
        onSaved(res.data.data);
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Booking failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PK", {
      weekday: "long",
      day:     "numeric",
      month:   "long",
      year:    "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return new Date(`1970-01-01T${timeStr}:00`)
      .toLocaleTimeString("en-PK", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      });
  };

  return (
    <>
      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position:     "fixed",
          top:          "20px",
          right:        "20px",
          zIndex:       100,
          padding:      "14px 20px",
          borderRadius: "12px",
          background:   "#DCFCE7",
          border:       "1px solid #BBF7D0",
          color:        "#15803D",
          fontSize:     "14px",
          fontWeight:   500,
          display:      "flex",
          alignItems:   "center",
          gap:          "8px",
          boxShadow:    "0 4px 20px rgba(0,0,0,0.12)",
          animation:    "slideIn 0.3s ease",
        }}>
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      <div style={s.overlay}>
        <div style={s.modal}>

          {/* ── Modal header ── */}
          <div style={s.header}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700,
                           color: "#0F172A", margin: 0 }}>
                Book Appointment
              </h2>
              <p style={{ fontSize: "13px", color: "#64748B",
                          margin: "3px 0 0" }}>
                Step {step} of 4 ·{" "}
                {["Select Doctor","Choose Date & Time",
                  "Visit Details","Confirm Booking"][step - 1]}
              </p>
            </div>
            <button onClick={onClose} style={{
              background:     "#FFFFFF60",
              border:         "none",
              borderRadius:   "8px",
              width:          "32px",
              height:         "32px",
              cursor:         "pointer",
              color:          "#475569",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}>
              <X size={16} />
            </button>
          </div>

          {/* ── Modal body ── */}
          <div style={s.body}>
            <Steps current={step} />

            {/* ── Error banner ── */}
            {error && (
              <div style={{
                padding:      "12px 16px",
                background:   "#FEE2E2",
                border:       "1px solid #FECACA",
                borderRadius: "10px",
                color:        "#DC2626",
                fontSize:     "13px",
                marginBottom: "16px",
                display:      "flex",
                alignItems:   "center",
                gap:          "8px",
              }}>
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            {/* ════════ STEP 1 — SELECT DOCTOR ════════ */}
            {step === 1 && (
              <div>
                {/* Department filter */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={s.label}>Filter by Department</label>
                  <div style={{ display: "flex", flexWrap: "wrap",
                                gap: "8px" }}>
                    {availableDepts.map((dept) => (
                      <button key={dept}
                              onClick={() => {
                                setDepartment(dept);
                                setSelectedDoc(null);
                              }}
                              style={{
                                padding:      "6px 14px",
                                borderRadius: "20px",
                                fontSize:     "12px",
                                fontWeight:   dept === department ? 600 : 400,
                                cursor:       "pointer",
                                border:       dept === department
                                  ? "2px solid #0F766E"
                                  : "1px solid #E2E8F0",
                                background:   dept === department
                                  ? "#F0FDFA" : "#FFFFFF",
                                color:        dept === department
                                  ? "#0F766E" : "#64748B",
                              }}>
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Doctor list */}
                {fetchingDocs ? (
                  <div style={{ textAlign: "center", padding: "30px 0" }}>
                    <Loader size={24} color="#0F766E"
                            style={{ animation: "spin 0.8s linear infinite",
                                     margin: "0 auto" }} />
                    <p style={{ color: "#94A3B8", fontSize: "13px",
                                marginTop: "10px" }}>
                      Loading doctors...
                    </p>
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px",
                                background: "#F8FAFC",
                                borderRadius: "12px" }}>
                    <Stethoscope size={28} color="#CBD5E1"
                                 style={{ marginBottom: "10px" }} />
                    <p style={{ color: "#94A3B8", fontSize: "14px",
                                margin: 0 }}>
                      No doctors found for this department
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex",
                                flexDirection: "column", gap: "10px" }}>
                    {filteredDocs.map((doc) => {
                      const isSelected = selectedDoc?.id === doc.id;
                      const initials   =
                        `${doc.firstName?.[0]??""}`+
                        `${doc.lastName?.[0]??""}`.toUpperCase();

                      return (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          style={{
                            display:      "flex",
                            alignItems:   "center",
                            gap:          "14px",
                            padding:      "14px 16px",
                            borderRadius: "12px",
                            border:       isSelected
                              ? "2px solid #0F766E"
                              : "1px solid #E2E8F0",
                            background:   isSelected
                              ? "linear-gradient(135deg,#F0FDFA,#EEF2FF)"
                              : "#FFFFFF",
                            cursor:       "pointer",
                            textAlign:    "left",
                            transition:   "all 0.15s",
                            width:        "100%",
                          }}
                        >
                          {/* Avatar */}
                          <div style={{
                            width:          "44px",
                            height:         "44px",
                            borderRadius:   "12px",
                            background:     isSelected
                              ? "#CCFBF1" : "#F1F5F9",
                            display:        "flex",
                            alignItems:     "center",
                            justifyContent: "center",
                            fontSize:       "15px",
                            fontWeight:     700,
                            color:          isSelected
                              ? "#0F766E" : "#64748B",
                            flexShrink:     0,
                          }}>
                            {initials}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "15px", fontWeight: 600,
                                        color: "#0F172A", margin: 0 }}>
                              Dr. {doc.firstName} {doc.lastName}
                            </p>
                            <p style={{ fontSize: "12px",
                                        color: "#64748B",
                                        margin: "3px 0 0" }}>
                              {doc.specialization || "General Practice"}
                            </p>
                            {doc.phone && (
                              <p style={{ fontSize: "11px",
                                          color: "#94A3B8",
                                          margin: "2px 0 0" }}>
                                {doc.phone}
                              </p>
                            )}
                          </div>

                          {/* Selected indicator */}
                          {isSelected && (
                            <CheckCircle2 size={20} color="#0F766E"
                                          style={{ flexShrink: 0 }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════════ STEP 2 — DATE & TIME ════════ */}
            {step === 2 && (
              <div>
                {/* Selected doctor summary */}
                {selectedDoc && (
                  <div style={{
                    padding:      "12px 16px",
                    background:   "#F0FDFA",
                    borderRadius: "10px",
                    border:       "1px solid #CCFBF1",
                    marginBottom: "20px",
                    display:      "flex",
                    alignItems:   "center",
                    gap:          "10px",
                  }}>
                    <Stethoscope size={16} color="#0F766E" />
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600,
                                  color: "#0F172A", margin: 0 }}>
                        Dr. {selectedDoc.firstName} {selectedDoc.lastName}
                      </p>
                      <p style={{ fontSize: "12px", color: "#64748B",
                                  margin: "2px 0 0" }}>
                        {selectedDoc.specialization || "General Practice"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Calendar */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={s.label}>Select Date</label>
                  <div style={{
                    padding:      "16px",
                    background:   "#F8FAFC",
                    borderRadius: "12px",
                    border:       "1px solid #E2E8F0",
                  }}>
                    <CalendarPicker
                      selectedDate={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedSlot("");
                      }}
                      doctorId={selectedDoc?.id}
                    />
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div>
                    <label style={s.label}>
                      Available Slots — {formatDate(selectedDate)}
                    </label>
                    <div style={{
                      padding:      "16px",
                      background:   "#F8FAFC",
                      borderRadius: "12px",
                      border:       "1px solid #E2E8F0",
                    }}>
                      <SlotPicker
                        doctorId={selectedDoc?.id}
                        date={selectedDate}
                        selectedSlot={selectedSlot}
                        onSelect={setSelectedSlot}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════ STEP 3 — VISIT DETAILS ════════ */}
            {step === 3 && (
              <div style={{ display: "flex",
                            flexDirection: "column", gap: "16px" }}>

                {/* Appointment summary pill */}
                <div style={{
                  padding:      "14px 16px",
                  background:   "linear-gradient(135deg,#F0FDFA,#EEF2FF)",
                  borderRadius: "12px",
                  border:       "1px solid #CCFBF1",
                }}>
                  <div style={{ display: "flex", gap: "16px",
                                flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", color: "#475569",
                                   display: "flex", alignItems: "center",
                                   gap: "6px" }}>
                      <User size={13} color="#0F766E" />
                      Dr. {selectedDoc?.firstName} {selectedDoc?.lastName}
                    </span>
                    <span style={{ fontSize: "13px", color: "#475569",
                                   display: "flex", alignItems: "center",
                                   gap: "6px" }}>
                      <Calendar size={13} color="#6366F1" />
                      {formatDate(selectedDate)}
                    </span>
                    <span style={{ fontSize: "13px", color: "#475569",
                                   display: "flex", alignItems: "center",
                                   gap: "6px" }}>
                      <Clock size={13} color="#A855F7" />
                      {formatTime(selectedSlot)}
                    </span>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label style={s.label}>
                    Reason for Visit{" "}
                    <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    style={{
                      ...s.input,
                      borderColor: !reason.trim() && error
                        ? "#EF4444" : "#E2E8F0",
                    }}
                    placeholder="e.g. Regular checkup, Chest pain, Follow-up..."
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setError("");
                    }}
                    maxLength={200}
                  />
                  <p style={{ fontSize: "11px", color: "#94A3B8",
                              marginTop: "4px", textAlign: "right" }}>
                    {reason.length}/200
                  </p>
                </div>

                {/* Symptoms */}
                <div>
                  <label style={s.label}>
                    Describe Your Symptoms (optional)
                  </label>
                  <textarea
                    style={{
                      ...s.input,
                      height:   "100px",
                      resize:   "none",
                    }}
                    placeholder="Describe your symptoms in detail to help the doctor prepare..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    maxLength={1000}
                  />
                  <p style={{ fontSize: "11px", color: "#94A3B8",
                              marginTop: "4px", textAlign: "right" }}>
                    {symptoms.length}/1000
                  </p>
                </div>
              </div>
            )}

            {/* ════════ STEP 4 — CONFIRM ════════ */}
            {step === 4 && (
              <div style={{ display: "flex",
                            flexDirection: "column", gap: "14px" }}>

                <div style={{ textAlign: "center", marginBottom: "8px" }}>
                  <div style={{
                    width:          "64px",
                    height:         "64px",
                    borderRadius:   "20px",
                    background:     "linear-gradient(135deg,#F0FDFA,#EEF2FF)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    margin:         "0 auto 12px",
                  }}>
                    <Calendar size={28} color="#0F766E" />
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700,
                               color: "#0F172A", margin: 0 }}>
                    Confirm Your Booking
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748B",
                              marginTop: "4px" }}>
                    Please review your appointment details
                  </p>
                </div>

                {/* Confirmation card */}
                <div style={{
                  padding:      "20px",
                  background:   "#F8FAFC",
                  borderRadius: "14px",
                  border:       "1px solid #E2E8F0",
                  display:      "flex",
                  flexDirection:"column",
                  gap:          "12px",
                }}>
                  {[
                    {
                      icon:  <Stethoscope size={15} color="#0F766E" />,
                      label: "Doctor",
                      value: `Dr. ${selectedDoc?.firstName} ${selectedDoc?.lastName}`,
                      sub:   selectedDoc?.specialization || "General Practice",
                    },
                    {
                      icon:  <Calendar size={15} color="#6366F1" />,
                      label: "Date",
                      value: formatDate(selectedDate),
                    },
                    {
                      icon:  <Clock size={15} color="#A855F7" />,
                      label: "Time",
                      value: formatTime(selectedSlot),
                    },
                    {
                      icon:  <FileText size={15} color="#B45309" />,
                      label: "Reason",
                      value: reason,
                    },
                    ...(symptoms ? [{
                      icon:  <FileText size={15} color="#64748B" />,
                      label: "Symptoms",
                      value: symptoms,
                    }] : []),
                  ].map((row) => (
                    <div key={row.label} style={{
                      display:        "flex",
                      alignItems:     "flex-start",
                      gap:            "12px",
                      paddingBottom:  "12px",
                      borderBottom:   "1px solid #F1F5F9",
                    }}>
                      <div style={{
                        width:          "32px",
                        height:         "32px",
                        borderRadius:   "8px",
                        background:     "#FFFFFF",
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        flexShrink:     0,
                        border:         "1px solid #E2E8F0",
                      }}>
                        {row.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: "11px", fontWeight: 600,
                                    color: "#94A3B8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                    margin: 0 }}>
                          {row.label}
                        </p>
                        <p style={{ fontSize: "14px", fontWeight: 500,
                                    color: "#0F172A",
                                    margin: "3px 0 0",
                                    lineHeight: 1.5 }}>
                          {row.value}
                        </p>
                        {row.sub && (
                          <p style={{ fontSize: "12px", color: "#64748B",
                                      margin: "2px 0 0" }}>
                            {row.sub}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status note */}
                <div style={{
                  padding:      "12px 16px",
                  background:   "#FEF3C7",
                  borderRadius: "10px",
                  border:       "1px solid #FDE68A",
                  display:      "flex",
                  alignItems:   "center",
                  gap:          "8px",
                  fontSize:     "13px",
                  color:        "#92400E",
                }}>
                  <Clock size={14} />
                  Your appointment will be <strong>Pending</strong> until
                  confirmed by the clinic staff.
                </div>
              </div>
            )}
          </div>

          {/* ── Footer navigation ── */}
          <div style={{
            padding:      "16px 24px",
            borderTop:    "1px solid #E2E8F0",
            display:      "flex",
            justifyContent: "space-between",
            alignItems:   "center",
            background:   "#FAFAFA",
          }}>
            {step > 1 ? (
              <button onClick={handleBack} style={s.btnSec}>
                <ChevronLeft size={15} />
                Back
              </button>
            ) : (
              <button onClick={onClose} style={s.btnSec}>
                Cancel
              </button>
            )}

            {step < 4 ? (
              <button onClick={handleNext} style={s.btn}>
                Continue
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleBook}
                disabled={loading}
                style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <>
                    <Loader size={15}
                            style={{ animation:
                              "spin 0.8s linear infinite" }} />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    Confirm Booking
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </>
  );
}