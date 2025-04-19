"use client";

import { createWeb3Modal } from "@web3modal/wagmi/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { optimism } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

const metadata = {
  name: "Crypto Trading Competition",
  description: "Trade mock tokens on Ethereum",
  url: "https://nuctc.tech",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const config = createConfig({
  chains: [optimism],
  connectors: [
    injected(),
    walletConnect({ projectId, metadata, showQrModal: false }),
  ],
  transports: {
    [optimism.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
});

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#f97316",
  },
});

export function Web3Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
