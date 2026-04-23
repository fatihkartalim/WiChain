"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: string;
  title: string;
  body?: string;
  tone: ToastTone;
};

type ToastInput = Omit<Toast, "id">;

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((current) => [{ ...toast, id }, ...current].slice(0, 3));
      window.setTimeout(() => dismissToast(id), 4500);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 grid w-[min(360px,calc(100vw-32px))] gap-3" aria-live="polite">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icon = {
    success: <CheckCircle2 aria-hidden="true" size={18} />,
    error: <AlertCircle aria-hidden="true" size={18} />,
    info: <Info aria-hidden="true" size={18} />
  }[toast.tone];

  const toneClass = {
    success: "border-fern/30 text-fern",
    error: "border-coral/30 text-coral",
    info: "border-ink/20 text-ink"
  }[toast.tone];

  return (
    <div className={`rounded-lg border bg-white p-4 shadow-soft ${toneClass}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="font-black text-ink">{toast.title}</div>
          {toast.body ? <p className="mt-1 text-sm leading-5 text-ink/65">{toast.body}</p> : null}
        </div>
        <button onClick={onDismiss} className="grid h-8 w-8 place-items-center rounded-md text-ink/55 transition hover:bg-mist hover:text-ink" aria-label="Dismiss notification">
          <X aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  );
}
