"use client";

import { use, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, PlayCircle } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { PanelGrid, PanelMetric, ProtectedPanel } from "@/components/protected-panel";
import { WalletButton } from "@/components/wallet-button";
import { WalletStatus } from "@/components/wallet-status";
import { useWallet } from "@/contexts/wallet-context";
import { getApiErrorMessage } from "@/lib/api-error";
import { shouldUseMocks } from "@/lib/mock-mode";
import { preparePayment, verifyPayment } from "@/services/payment.service";
import { startSession } from "@/services/session.service";
import { sendNativePayment } from "@/services/wallet.service";

export default function CheckoutPage({ params }: { params: Promise<{ packageId: string }> }) {
  const { packageId } = use(params);

  return (
    <AuthGuard allowedRoles={["USER", "NODE_OWNER", "ADMIN"]}>
      <CheckoutContent packageId={packageId} />
    </AuthGuard>
  );
}

function CheckoutContent({ packageId }: { packageId: string }) {
  const { wallet, isWrongNetwork, connect } = useWallet();
  const [txHash, setTxHash] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  const preparation = useQuery({
    queryKey: ["payments", "prepare", packageId],
    queryFn: () => preparePayment(packageId)
  });

  const payment = useMutation({
    mutationFn: async () => {
      setCheckoutError("");
      const prepared = preparation.data ?? (await preparePayment(packageId));
      const connectedWallet = wallet ?? (await connect());

      if (!connectedWallet) {
        throw new Error("Connect wallet before payment.");
      }

      if (isWrongNetwork || connectedWallet.chainId !== prepared.chainId) {
        throw new Error("Switch MetaMask to Monad Testnet before payment.");
      }

      const hash = shouldUseMocks()
        ? "0x8fd134a09f0f4c3d06da54c39cb73bcf0ef7392aa05f3f5263d12841f9e00001"
        : await sendNativePayment(prepared.recipientAddress, prepared.amount);

      setTxHash(hash);
      return verifyPayment(packageId, hash);
    },
    onError: (error) => {
      setCheckoutError(getApiErrorMessage(error, error instanceof Error ? error.message : "Payment failed."));
    }
  });

  const sessionStart = useMutation({
    mutationFn: async () => {
      if (!payment.data?.purchaseId) {
        throw new Error("Payment must be verified before session start.");
      }

      return startSession(payment.data.purchaseId);
    },
    onError: (error) => {
      setCheckoutError(getApiErrorMessage(error, error instanceof Error ? error.message : "Session could not start."));
    }
  });

  const prepared = preparation.data;
  const verified = payment.data;

  return (
    <ProtectedPanel title="Checkout" subtitle="Payment preparation and wallet transaction flow.">
      <div className="mb-4 flex justify-end">
        <WalletButton />
      </div>

      <div className="grid gap-4">
        <WalletStatus />

        <PanelGrid>
          <PanelMetric label="Package" value={packageId.slice(0, 8)} />
          <PanelMetric label="Network" value={prepared ? prepared.chainId.toString() : "Loading"} />
          <PanelMetric label="Amount" value={prepared ? `${prepared.amount} ${prepared.currency}` : "-"} />
        </PanelGrid>

        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-black text-ink">Payment</h2>
              <p className="mt-2 text-sm text-ink/65">
                {verified ? "Payment verified. Session start can be enabled next." : "Prepare payment, confirm in wallet, then verify the transaction."}
              </p>
            </div>
            <button
              onClick={() => payment.mutate()}
              disabled={preparation.isLoading || payment.isPending || Boolean(verified)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-ink px-5 font-semibold text-white transition hover:bg-fern disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verified ? <CheckCircle2 aria-hidden="true" size={18} /> : <CreditCard aria-hidden="true" size={18} />}
              {payment.isPending ? "Processing" : verified ? "Verified" : "Pay package"}
            </button>
          </div>

          {preparation.isError ? <Message tone="error" text="Payment preparation failed." /> : null}
          {checkoutError ? <Message tone="error" text={checkoutError} /> : null}
          {txHash ? <Message tone="success" text={`Transaction: ${txHash.slice(0, 12)}...${txHash.slice(-8)}`} /> : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => sessionStart.mutate()}
              disabled={!verified || sessionStart.isPending}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${
                verified ? "bg-fern text-white transition hover:bg-ink" : "cursor-not-allowed bg-ink/10 text-ink/40"
              }`}
            >
              <PlayCircle aria-hidden="true" size={18} />
              {sessionStart.isPending ? "Starting session" : "Start session"}
            </button>
            {sessionStart.data ? (
              <a href="/session" className="inline-flex min-h-11 items-center justify-center rounded-md border border-fern/25 bg-white px-4 text-sm font-semibold text-fern">
                Open active session
              </a>
            ) : null}
          </div>
        </section>
      </div>
    </ProtectedPanel>
  );
}

function Message({ tone, text }: { tone: "success" | "error"; text: string }) {
  return (
    <div className={`mt-4 rounded-md border p-3 text-sm font-semibold ${tone === "success" ? "border-fern/25 bg-fern/10 text-fern" : "border-coral/30 bg-coral/10 text-coral"}`}>
      {text}
    </div>
  );
}
