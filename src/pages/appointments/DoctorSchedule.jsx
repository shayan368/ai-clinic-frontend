import { useState, useEffect } from "react";
import { appointmentAPI, patientAPI } from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  CalendarDays, Clock, CheckCircle2,
  ChevronLeft, ChevronRight, User,
} from "lucide-react";

// ── Day column header ──
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function DoctorSchedule() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [patients,     setPatients]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [currentDate,  setCurrentDate]  = useState(new Date());
  const [selectedDay,  setSelectedDay]  = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apptRes, patRes] = await Promise.all([
        appointmentAPI.getByDoctor(user.id),
        patientAPI.getAll(),
      ]);
      setAppointments(apptRes.data.data || []);
      setPatients(patRes.data.data      || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (id) => {
    const p = patients.find((p) => p.id === id);
    return p ? p.name : `Patient #${id}`;
  };

  // ── Calendar helpers ──
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  // ── Get appointments for a specific day ──
  const getApptForDay = (day) => {
    return appointments.filter((a) => {
      const d = new Date(a.date);
      return (
        d.getFullYear() === year &&
        d.getMonth()    === month &&
        d.getDate()     === day
      );
    });
  };

  // ── Selected day appointments ──
  const selectedAppts = selectedDay ? getApptForDay(selectedDay) : [];

  // ── Today ──
  const today    = new Date();
  const isToday  = (day) =>
    today.getFullYear() === year &&
    today.getMonth()    === month &&
    today.getDate()     === day;

  const statusColor = {
    confirmed: "#22C55E",
    pending:   "#F59E0B",
    completed: "#64748B",
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-card rounded-xl" />
        <div className="h-80 bg-card rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="page-title">My Schedule</h1>
        <p className="page-subtitle">
          {appointments.length} total appointments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Calendar ── */}
        <div className="card lg:col-span-2">

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center
                         rounded-lg btn-ghost !p-0"
            >
              <ChevronLeft size={16} />
            </button>

            <h2 className="text-lg font-bold text-textPrimary">
              {MONTH_NAMES[month]} {year}
            </h2>

            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center
                         rounded-lg btn-ghost !p-0"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map((d) => (
              <div key={d}
                   className="text-center text-xs font-medium
                              text-textMuted py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">

            {/* Empty cells before first day */}
            {[...Array(firstDay)].map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day      = i + 1;
              const dayAppts = getApptForDay(day);
              const hasAppts = dayAppts.length > 0;
              const selected = selectedDay === day;
              const todayDay = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() =>
                    setSelectedDay(selected ? null : day)
                  }
                  className="relative flex flex-col items-center
                             justify-center rounded-xl py-2 px-1
                             transition-all duration-150 min-h-[48px]"
                  style={
                    selected
                      ? {
                          background:
                            "linear-gradient(135deg,#0F766E,#6366F1)",
                          color: "#fff",
                        }
                      : todayDay
                      ? {
                          background: "rgba(20,184,166,0.15)",
                          color:      "#14B8A6",
                        }
                      : {
                          color: hasAppts
                            ? "#F1F5F9"
                            : "#64748B",
                        }
                  }
                >
                  <span className="text-sm font-medium">{day}</span>

                  {/* Appointment dots */}
                  {hasAppts && (
                    <div className="flex gap-0.5 mt-1">
                      {dayAppts.slice(0, 3).map((a, idx) => (
                        <span
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: selected
                              ? "#fff"
                              : statusColor[a.status] || "#14B8A6",
                          }}
                        />
                      ))}
                      {dayAppts.length > 3 && (
                        <span className="text-[9px]">
                          +{dayAppts.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4
                          border-t border-border">
            {[
              { label: "Pending",   color: "#F59E0B" },
              { label: "Confirmed", color: "#22C55E" },
              { label: "Completed", color: "#64748B" },
            ].map((item) => (
              <div key={item.label}
                   className="flex items-center gap-1.5 text-xs
                              text-textMuted">
                <span className="w-2 h-2 rounded-full"
                      style={{ background: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Day detail panel ── */}
        <div className="card flex flex-col gap-4">
          <div>
            <h3 className="font-semibold text-textPrimary">
              {selectedDay
                ? `${MONTH_NAMES[month]} ${selectedDay}, ${year}`
                : "Select a day"}
            </h3>
            <p className="text-xs text-textSecondary mt-0.5">
              {selectedDay
                ? `${selectedAppts.length} appointment(s)`
                : "Click a day to see appointments"}
            </p>
          </div>

          {!selectedDay ? (
            <div className="flex flex-col items-center justify-center
                            py-10 gap-3">
              <CalendarDays size={32} className="text-textMuted" />
              <p className="text-textSecondary text-sm text-center">
                Click any day on the calendar to view appointments
              </p>
            </div>
          ) : selectedAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center
                            py-10 gap-3">
              <Clock size={32} className="text-textMuted" />
              <p className="text-textSecondary text-sm text-center">
                No appointments on this day
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedAppts.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(15,23,42,0.5)",
                           border: "1px solid #1E293B" }}
                >
                  {/* Time */}
                  <div
                    className="flex-shrink-0 px-2 py-1 rounded-lg
                               text-xs font-bold text-center min-w-[48px]"
                    style={{ background: "rgba(20,184,166,0.1)",
                             color: "#14B8A6" }}
                  >
                    {new Date(appt.date).toLocaleTimeString("en-PK", {
                      hour:   "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-textPrimary
                                   truncate">
                        {getPatientName(appt.patientId)}
                      </p>
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background:
                            statusColor[appt.status] || "#14B8A6",
                        }}
                      />
                    </div>
                    <p className="text-xs text-textMuted mt-0.5 capitalize">
                      {appt.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Today's summary */}
          <div className="mt-auto pt-4 border-t border-border">
            <p className="text-xs text-textMuted mb-2">Today's summary</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Total",
                  value: getApptForDay(today.getDate()).length,
                  color: "#14B8A6",
                },
                {
                  label: "Pending",
                  value: getApptForDay(today.getDate()).filter(
                    (a) => a.status === "pending"
                  ).length,
                  color: "#F59E0B",
                },
                {
                  label: "Done",
                  value: getApptForDay(today.getDate()).filter(
                    (a) => a.status === "completed"
                  ).length,
                  color: "#22C55E",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center p-2 rounded-xl"
                  style={{ background: s.color + "10" }}
                >
                  <span className="text-lg font-bold"
                        style={{ color: s.color }}>
                    {s.value}
                  </span>
                  <span className="text-[10px] text-textMuted mt-0.5">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}