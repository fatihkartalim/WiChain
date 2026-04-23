import { apiClient } from "@/lib/api-client";
import { shouldUseMocks } from "@/lib/mock-mode";
import sessionMock from "@/mocks/session.active.json";
import type { ActiveSession, ApiSuccess, CompletedSession } from "@/types/api";

const ACTIVE_SESSION_KEY = "activeSession";
const COMPLETED_SESSION_KEY = "completedSession";

export async function startSession(purchaseId: string) {
  if (shouldUseMocks()) {
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + sessionMock.data.remainingSeconds * 1000);
    const session = {
      ...sessionMock.data,
      purchaseId,
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: "ACTIVE"
    } as ActiveSession;
    storeSession(session);
    return session;
  }

  const response = await apiClient.post<ApiSuccess<ActiveSession>>("/sessions/start", { purchaseId });
  return response.data.data;
}

export async function endSession(id: string) {
  if (shouldUseMocks()) {
    const stored = readStoredSession();
    const endedSession = {
      ...(stored ?? sessionMock.data),
      id,
      status: "ENDED",
      remainingSeconds: 0,
      endedAt: new Date().toISOString()
    } as CompletedSession;
    storeCompletedSession(endedSession);
    clearStoredSession();
    return endedSession;
  }

  const response = await apiClient.post<ApiSuccess<ActiveSession & { endedAt: string }>>("/sessions/end", { sessionId: id });
  return response.data.data;
}

export async function getActiveSession() {
  if (shouldUseMocks()) {
    const stored = readStoredSession();
    if (!stored) {
      return null;
    }

    const remainingSeconds = Math.max(0, Math.floor((new Date(stored.endsAt).getTime() - Date.now()) / 1000));
    if (remainingSeconds === 0) {
      storeCompletedSession({ ...stored, remainingSeconds: 0, status: "EXPIRED", endedAt: new Date().toISOString() });
      clearStoredSession();
      return { ...stored, remainingSeconds: 0, status: "EXPIRED" } as ActiveSession;
    }

    return { ...stored, remainingSeconds } as ActiveSession;
  }

  const response = await apiClient.get<ApiSuccess<ActiveSession | null>>("/sessions/active");
  return response.data.data;
}

export async function getLastCompletedSession() {
  if (shouldUseMocks()) {
    return readCompletedSession();
  }

  return null;
}

function storeSession(session: ActiveSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
}

function storeCompletedSession(session: CompletedSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(COMPLETED_SESSION_KEY, JSON.stringify(session));
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ActiveSession;
  } catch {
    return null;
  }
}

function readCompletedSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(COMPLETED_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CompletedSession;
  } catch {
    return null;
  }
}

function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACTIVE_SESSION_KEY);
}
