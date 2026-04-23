"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MONAD_TESTNET } from "@/lib/blockchain";
import { connectWallet, getWalletConnection, WalletError, type WalletConnection } from "@/services/wallet.service";
import type { WalletErrorCode } from "@/types/api";

type WalletContextValue = {
  wallet: WalletConnection | null;
  isConnected: boolean;
  isWrongNetwork: boolean;
  isConnecting: boolean;
  errorCode: WalletErrorCode | null;
  errorMessage: string;
  connect: () => Promise<WalletConnection | null>;
  disconnect: () => void;
  refresh: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorCode, setErrorCode] = useState<WalletErrorCode | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleError = useCallback((error: unknown) => {
    if (error instanceof WalletError) {
      setErrorCode(error.code);
      setErrorMessage(error.message);
      return;
    }

    setErrorCode("TX_FAILED");
    setErrorMessage("Wallet operation failed.");
  }, []);

  const refresh = useCallback(async () => {
    if (!wallet?.address) {
      return;
    }

    try {
      setWallet(await getWalletConnection(wallet.address));
      setErrorCode(null);
      setErrorMessage("");
    } catch (error) {
      handleError(error);
    }
  }, [handleError, wallet?.address]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setErrorCode(null);
    setErrorMessage("");

    try {
      const nextWallet = await connectWallet();
      setWallet(nextWallet);
      return nextWallet;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [handleError]);

  const disconnect = useCallback(() => {
    setWallet(null);
    setErrorCode(null);
    setErrorMessage("");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum?.on) {
      return;
    }

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts?.[0]) {
        disconnect();
        return;
      }
      getWalletConnection(accounts[0]).then(setWallet).catch(handleError);
    };
    const handleChainChanged = () => {
      refresh();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [disconnect, handleError, refresh]);

  const value = useMemo(
    () => ({
      wallet,
      isConnected: Boolean(wallet),
      isWrongNetwork: Boolean(wallet && wallet.chainId !== MONAD_TESTNET.chainId),
      isConnecting,
      errorCode,
      errorMessage,
      connect,
      disconnect,
      refresh
    }),
    [connect, disconnect, errorCode, errorMessage, isConnecting, refresh, wallet]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return context;
}
