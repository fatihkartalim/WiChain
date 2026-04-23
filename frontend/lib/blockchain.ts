export const MONAD_TESTNET = {
  name: "Monad Testnet",
  chainId: 10143,
  chainIdHex: "0x279f",
  currencySymbol: "MON"
} as const;

export function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
