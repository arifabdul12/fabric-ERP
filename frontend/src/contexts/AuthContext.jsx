import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, formatApiErrorDetail } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [error, setError] = useState("");

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem("kayum_token");
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (e) {
      localStorage.removeItem("kayum_token");
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("kayum_token", data.token);
      setUser(data.user);
      return true;
    } catch (e) {
      setError(formatApiErrorDetail(e.response?.data?.detail) || e.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("kayum_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, error, setError, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
