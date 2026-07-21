import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/axios.js";

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const AuthContext = createContext(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── On mount: restore session from localStorage ──
  useEffect(() => {
    const token       = localStorage.getItem("token");
    const storedUser  = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  // ── LOGIN ──
  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });

    const { token, data } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user",  JSON.stringify(data));

    setUser(data);
    return data;
  };

  // ── REGISTER ──
  const register = async (formData) => {
    const res = await authAPI.register(formData);

    const { token, data } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user",  JSON.stringify(data));

    setUser(data);
    return data;
  };

  // ── LOGOUT ──
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  // ── UPDATE USER in context after profile update ──
  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  };

  // ── Role helpers ──
  const isAdmin        = user?.role === "admin";
  const isDoctor       = user?.role === "doctor";
  const isReceptionist = user?.role === "receptionist";
  const isPatient      = user?.role === "patient";
  const isPro          = user?.subscriptionPlan === "pro";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAdmin,
        isDoctor,
        isReceptionist,
        isPatient,
        isPro,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};