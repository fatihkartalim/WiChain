"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { ToastProvider } from "@/contexts/toast-context";
import { WalletProvider } from "@/contexts/wallet-context";
import { getHttpStatus } from "@/lib/api-error";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              const status = getHttpStatus(error);
              if (status === 401 || status === 403 || status === 404) {
                return false;
              }
              return failureCount < 1;
            }
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <WalletProvider>{children}</WalletProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
