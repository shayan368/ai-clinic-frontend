import axios from "axios";

// ─────────────────────────────────────────────
// Base instance
// ─────────────────────────────────────────────
const API = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ─────────────────────────────────────────────
// Request interceptor — attach token automatically
// ─────────────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// Response interceptor — handle 401 globally
// ─────────────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// Auth endpoints
// ─────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post("/auth/register", data),
  login: (data) => API.post("/auth/login", data),
  getMe: () => API.get("/auth/me"),
  updateProfile: (data) => API.put("/auth/update-profile", data),
  changePassword: (data) => API.put("/auth/change-password", data),
  upgradePlan: (data) => API.put("/auth/upgrade-plan", data),
};

// ─────────────────────────────────────────────
// Patient endpoints
// ─────────────────────────────────────────────
export const patientAPI = {
  create:         (data)      => API.post("/patients", data),
  getAll:         (params)    => API.get("/patients", { params }),
  getUnified:     ()          => API.get("/patients/unified"),
  getOne:         (id)        => API.get(`/patients/${id}`),
  update:         (id, data)  => API.put(`/patients/${id}`, data),
  delete:         (id)        => API.delete(`/patients/${id}`),
  // ← NEW: for app users with or without a Patient record
  upsertAppUser:  (userId, data) =>
    API.post(`/patients/upsert-user/${userId}`, data),
};

// ─────────────────────────────────────────────
// Appointment endpoints
// ─────────────────────────────────────────────
export const appointmentAPI = {
  create:          (data)           => API.post("/appointments", data),
  getAll:          (params)         => API.get("/appointments", { params }),
  getOne:          (id)             => API.get(`/appointments/${id}`),
  update:          (id, data)       => API.put(`/appointments/${id}`, data),
  delete:          (id)             => API.delete(`/appointments/${id}`),
  getByDoctor:     (doctorId)       => API.get(`/appointments/doctor/${doctorId}`),
  getByDoctorDetailed: (doctorId)   => API.get(`/appointments/doctor/${doctorId}/detailed`), // ← NEW
  getByPatient:    (patientId)      => API.get(`/appointments/patient/${patientId}`),
  getSlots:        (doctorId, date) => API.get(`/appointments/slots/${doctorId}`, { params: { date } }),
  cancel:          (id)             => API.put(`/appointments/${id}`, { status: "cancelled" }),
  reschedule:      (id, date)       => API.put(`/appointments/${id}`, { date }),
};
// ─────────────────────────────────────────────
// Prescription endpoints
// ─────────────────────────────────────────────
export const prescriptionAPI = {
  create: (data) => API.post("/prescriptions", data),
  getAll: () => API.get("/prescriptions"),
  getOne: (id) => API.get(`/prescriptions/${id}`),
  update: (id, data) => API.put(`/prescriptions/${id}`, data),
  delete: (id) => API.delete(`/prescriptions/${id}`),
  getByPatient: (patientId) => API.get(`/prescriptions/patient/${patientId}`),
  getByDoctor: (doctorId) => API.get(`/prescriptions/doctor/${doctorId}`), // ← NEW
  download: (id) => API.get(`/prescriptions/${id}/download`, {
    responseType: "blob",
  }),
  cancel: (id) => API.put(`/appointments/${id}`, { status: "cancelled" }),
  reschedule: (id, date) => API.put(`/appointments/${id}`, { date }),
};

// ─────────────────────────────────────────────
// Doctor endpoints
// ─────────────────────────────────────────────
export const doctorAPI = {
  getAll: () => API.get("/doctors"),
  getOne: (id) => API.get(`/doctors/${id}`),
  getStats: (id) => API.get(`/doctors/${id}/stats`),
  getAnalytics: () => API.get("/doctors/admin/analytics"),
};

// ─────────────────────────────────────────────
// AI endpoints
// ─────────────────────────────────────────────
export const aiAPI = {
  symptomChecker: (data) => API.post("/ai/symptom-checker", data),
  prescriptionExplanation: (data) => API.post("/ai/prescription-explanation", data),
  riskFlagging: (data) => API.post("/ai/risk-flagging", data),
  predictiveAnalytics: (data) => API.post("/ai/predictive-analytics", data),
  getLogs: () => API.get("/ai/logs"),
  getLogsByDoctor: (doctorId) => API.get(`/ai/logs/doctor/${doctorId}`), // ← NEW
  getLogsByPatient: (patientId) => API.get(`/ai/logs/patient/${patientId}`),
  getSingleLog: (id) => API.get(`/ai/logs/${id}`),
};

export const userAPI = {
  getAll: () => API.get("/users"),
  getByRole: (role) => API.get(`/users/role/${role}`),
};

export default API;