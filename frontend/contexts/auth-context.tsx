"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMe, login, register, type LoginPayload, type RegisterPayload } from "@/services/auth.service";
import type { User } from "@/types/api";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginUser: (payload: LoginPayload) => Promise<User>;
  registerUser: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    getMe()
      .then((currentUser) => {
        setUser(currentUser);
        window.localStorage.setItem("authUser", JSON.stringify(currentUser));
      })
      .catch(() => {
        window.localStorage.removeItem("accessToken");
        window.localStorage.removeItem("refreshToken");
        window.localStorage.removeItem("authUser");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const loginUser = useCallback(async (payload: LoginPayload) => {
    const result = await login(payload);
    window.localStorage.setItem("accessToken", result.accessToken);
    window.localStorage.setItem("refreshToken", result.refreshToken);
    window.localStorage.setItem("authUser", JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }, []);

  const registerUser = useCallback(async (payload: RegisterPayload) => {
    const registeredUser = await register(payload);
    const loginResult = await login({ email: payload.email, password: payload.password });
    const mergedUser = { ...loginResult.user, ...registeredUser, role: payload.role };
    window.localStorage.setItem("accessToken", loginResult.accessToken);
    window.localStorage.setItem("refreshToken", loginResult.refreshToken);
    window.localStorage.setItem("authUser", JSON.stringify(mergedUser));
    setUser(mergedUser);
    return mergedUser;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("refreshToken");
    window.localStorage.removeItem("authUser");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      loginUser,
      registerUser,
      logout
    }),
    [isLoading, loginUser, logout, registerUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
