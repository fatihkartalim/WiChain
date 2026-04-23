import { apiClient } from "@/lib/api-client";
import { shouldUseMocks } from "@/lib/mock-mode";
import loginMock from "@/mocks/auth.login.json";
import meMock from "@/mocks/auth.me.json";
import registerMock from "@/mocks/auth.register.json";
import type { ApiSuccess, User, UserRole } from "@/types/api";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "ADMIN">;
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export async function login(payload: LoginPayload) {
  if (shouldUseMocks()) {
    const role = roleFromEmail(payload.email);
    const user = {
      ...loginMock.data.user,
      email: payload.email,
      role,
      name: role === "NODE_OWNER" ? "Demo Owner" : role === "ADMIN" ? "Demo Admin" : "Demo User"
    } as User;

    return {
      ...loginMock.data,
      accessToken: `mock-access-token-${role.toLowerCase()}`,
      refreshToken: `mock-refresh-token-${role.toLowerCase()}`,
      user
    } satisfies LoginResult;
  }

  const response = await apiClient.post<ApiSuccess<LoginResult>>("/auth/login", payload);
  return response.data.data;
}

export async function register(payload: RegisterPayload) {
  if (shouldUseMocks()) {
    return {
      ...registerMock.data,
      name: payload.name,
      email: payload.email,
      role: payload.role
    } as User;
  }

  const response = await apiClient.post<ApiSuccess<User>>("/auth/register", payload);
  return response.data.data;
}

export async function refresh() {
  if (shouldUseMocks()) {
    return { accessToken: "mock-access-token-refreshed" };
  }

  const response = await apiClient.post<ApiSuccess<{ accessToken: string }>>("/auth/refresh");
  return response.data.data;
}

export async function getMe() {
  if (shouldUseMocks()) {
    const storedUser = readStoredUser();
    if (storedUser) {
      return storedUser;
    }

    return meMock.data as User;
  }

  const response = await apiClient.get<ApiSuccess<User>>("/auth/me");
  return response.data.data;
}

function roleFromEmail(email: string): UserRole {
  const normalized = email.toLowerCase();
  if (normalized.includes("admin")) {
    return "ADMIN";
  }
  if (normalized.includes("owner")) {
    return "NODE_OWNER";
  }
  return "USER";
}

function readStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("authUser");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
