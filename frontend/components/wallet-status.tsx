"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { MONAD_TESTNET, shortenAddress } from "@/lib/blockchain";

export function WalletStatus() {
  const { wallet, isWrongNetwork, errorCode, errorMessage } = useWallet();

  if (errorCode) {
    return <Status tone="error" title={errorCode} body={errorMessage} />;
  }

  if (!wallet) {
    return <Status tone="neutral" title="Wallet not connected" body="Connect MetaMask to continue with Monad Testnet payment." />;
  }

  if (isWrongNetwork) {
    return <Status tone="error" title="Wrong network" body={`Switch wallet to ${MONAD_TESTNET.name} (${MONAD_TESTNET.chainId}).`} />;
  }

  return <Status tone="success" title={shortenAddress(wallet.address)} body={`${wallet.balance} ${MONAD_TESTNET.currencySymbol} available on ${MONAD_TESTNET.name}.`} />;
}

function Status({ tone, title, body }: { tone: "neutral" | "success" | "error"; title: string; body: string }) {
  const classes = {
    neutral: "border-ink/10 bg-white text-ink",
    success: "border-fern/25 bg-fern/10 text-fern",
    error: "border-coral/30 bg-coral/10 text-coral"
  };

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${classes[tone]}`}>
      {tone === "success" ? <CheckCircle2 aria-hidden="true" size={20} /> : <AlertTriangle aria-hidden="true" size={20} />}
      <div className="min-w-0">
        <div className="break-words font-bold">{title}</div>
        <div className="mt-1 break-words text-sm opacity-80">{body}</div>
      </div>
    </div>
  );
}
