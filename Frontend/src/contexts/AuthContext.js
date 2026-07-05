import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext();
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export function useAuth() {
  return useContext(AuthContext);
}

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}/api${path}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `HTTP ${response.status}`);
  }
  return payload;
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("auth_user") || "null");
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  async function signup(email, password, extra = {}) {
    const payload = await apiRequest("/auth/register-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, ...extra }),
    });
    if (payload?.user) {
      localStorage.setItem("auth_user", JSON.stringify(payload.user));
      setCurrentUser(payload.user);
    }
    return payload;
  }

  async function login(email, password, role = "customer") {
    const payload = await apiRequest("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    if (payload?.user) {
      localStorage.setItem("auth_user", JSON.stringify(payload.user));
      localStorage.setItem("auth_custom_token", payload.customToken || "");
      setCurrentUser(payload.user);
    }
    return payload;
  }

  async function loginWithGoogle() {
    return apiRequest("/auth/google/start", { method: "GET" });
  }

  function logout() {
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_custom_token");
    setCurrentUser(null);
    return Promise.resolve();
  }

  async function resetPassword(email) {
    return apiRequest("/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  }

  async function updateUserProfile(user, { displayName, photoURL, phoneNumber } = {}) {
    const payload = await apiRequest("/auth/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(localStorage.getItem("auth_custom_token")
          ? { Authorization: `Bearer ${localStorage.getItem("auth_custom_token")}` }
          : {}),
      },
      body: JSON.stringify({ displayName, photoURL, phoneNumber }),
    });
    if (payload?.user) {
      localStorage.setItem("auth_user", JSON.stringify(payload.user));
      setCurrentUser(payload.user);
    }
    return payload;
  }

  const value = useMemo(() => ({
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    updateUserProfile,
    loginWithGoogle,
  }), [currentUser]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
