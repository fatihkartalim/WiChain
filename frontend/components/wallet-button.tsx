"use client";

import { AlertTriangle, PlugZap, Unplug, Wallet } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { shortenAddress } from "@/lib/blockchain";

export function WalletButton() {
  const { wallet, connect, disconnect, isConnecting, isWrongNetwork, errorMessage } = useWallet();

  if (wallet) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`hidden min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold sm:flex ${
            isWrongNetwork ? "border-coral/40 bg-coral/10 text-coral" : "border-fern/25 bg-white text-ink"
          }`}
          title={isWrongNetwork ? "Wrong network" : `${wallet.balance} MON`}
        >
          {isWrongNetwork ? <AlertTriangle aria-hidden="true" size={17} /> : <Wallet aria-hidden="true" size={17} />}
          {shortenAddress(wallet.address)}
        </div>
        <button
          onClick={disconnect}
          className="grid h-11 w-11 place-items-center rounded-md border border-ink/15 bg-white text-ink transition hover:border-coral hover:text-coral"
          aria-label="Disconnect wallet"
        >
          <Unplug aria-hidden="true" size={18} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-fern disabled:cursor-not-allowed disabled:opacity-60"
      title={errorMessage || "Connect wallet"}
    >
      <PlugZap aria-hidden="true" size={18} />
      {isConnecting ? "Connecting" : "Wallet"}
    </button>
  );
}
