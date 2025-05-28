import { useEffect } from "react";
import { farcasterFrame as miniAppConnector } from "@farcaster/frame-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, useAccount, useConnect, useSwitchChain } from "wagmi";
import { monadTestnet } from "wagmi/chains";

export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
  connectors: [miniAppConnector()],
});

const queryClient = new QueryClient();

function WalletConnectionManager({ children }: { children: React.ReactNode }) {
  const { connect, connectors } = useConnect();
  const { switchChain } = useSwitchChain();
  const { isConnected, chainId } = useAccount();

  useEffect(() => {
    if (!isConnected && connectors[0]) {
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors, isConnected]);

  useEffect(() => {
    if (isConnected && chainId !== monadTestnet.id) {
      switchChain({ chainId: monadTestnet.id });
    }
  }, [switchChain, chainId, isConnected]);

  return children;
}

export default function FrameWalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletConnectionManager>{children}</WalletConnectionManager>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
