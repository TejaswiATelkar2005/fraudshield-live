"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  type AuthUser,
  type UserRole,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  subscribeToAuthChanges,
  getCurrentStoredUser,
} from "@/lib/firebase/auth";

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial check from localStorage or default analyst
    const initial = getCurrentStoredUser() || {
      uid: "default-analyst",
      email: "analyst@bank.com",
      displayName: "Priya Sharma (Sr. Analyst)",
      role: "analyst" as UserRole,
      isDemo: true,
    };
    setUser(initial);
    setLoading(false);

    const unsubscribe = subscribeToAuthChanges((u) => {
      if (u) setUser(u);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const loggedIn = await loginWithEmail(email, pass);
      setUser(loggedIn);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, role: UserRole = "analyst") => {
    setLoading(true);
    try {
      const newUser = await registerWithEmail(email, pass, role);
      setUser(newUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const quickLogin = async (role: UserRole) => {
    const email = role === "admin" ? "admin@bank.com" : "analyst@bank.com";
    await login(email, "password123");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        login,
        register,
        logout,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
