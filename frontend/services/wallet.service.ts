import { BrowserProvider, formatEther, parseEther } from "ethers";
import { MONAD_TESTNET } from "@/lib/blockchain";
import type { WalletErrorCode } from "@/types/api";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export type WalletConnection = {
  address: string;
  chainId: number;
  balance: string;
};

export class WalletError extends Error {
  code: WalletErrorCode;

  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export async function connectWallet(): Promise<WalletConnection> {
  const ethereum = getEthereum();
  const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];

  if (!accounts[0]) {
    throw new WalletError("WALLET_NOT_CONNECTED", "No wallet account was returned.");
  }

  return getWalletConnection(accounts[0]);
}

export async function getWalletConnection(address?: string): Promise<WalletConnection> {
  const ethereum = getEthereum();
  const provider = new BrowserProvider(ethereum);
  const network = await provider.getNetwork();
  const signer = await provider.getSigner();
  const walletAddress = address ?? (await signer.getAddress());
  const balance = await provider.getBalance(walletAddress);

  return {
    address: walletAddress,
    chainId: Number(network.chainId),
    balance: Number(formatEther(balance)).toFixed(4)
  };
}

export async function ensureMonadNetwork() {
  const ethereum = getEthereum();
  const chainId = (await ethereum.request({ method: "eth_chainId" })) as string;

  if (Number.parseInt(chainId, 16) !== MONAD_TESTNET.chainId) {
    throw new WalletError("WRONG_NETWORK", "Wallet is not connected to Monad Testnet.");
  }
}

export async function sendNativePayment(recipientAddress: string, amount: string) {
  const ethereum = getEthereum();

  try {
    await ensureMonadNetwork();
    return (await ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          to: recipientAddress,
          value: parseEther(amount).toString()
        }
      ]
    })) as string;
  } catch (error) {
    const candidate = error as { code?: number; message?: string };
    if (candidate.code === 4001) {
      throw new WalletError("USER_REJECTED_TRANSACTION", "Transaction was rejected in the wallet.");
    }
    if (candidate.message?.toLowerCase().includes("funds")) {
      throw new WalletError("INSUFFICIENT_FUNDS", "Wallet has insufficient MON.");
    }
    if (error instanceof WalletError) {
      throw error;
    }
    throw new WalletError("TX_FAILED", "Wallet transaction failed.");
  }
}

function getEthereum() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new WalletError("WALLET_NOT_CONNECTED", "MetaMask is not available.");
  }

  return window.ethereum;
}
