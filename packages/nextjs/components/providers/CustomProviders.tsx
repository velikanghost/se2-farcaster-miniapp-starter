"use client";

import React, { ReactNode, useEffect } from "react";
import { Eruda } from "../Eruda/ErudaProvider";
import { MiniAppProvider } from "../contexts/miniapp-context";
import { QueryClient } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "react-hot-toast";
import { useConnect, useSwitchChain } from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { ThemeProvider } from "~~/components/providers/ThemeProvider";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";

interface ProvidersProps {
  children: ReactNode;
}

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();

  const { connect, connectors } = useConnect();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    // Connect to the first available connector (Frame connector)
    if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors]);

  useEffect(() => {
    // Switch to Monad testnet
    switchChain({ chainId: monadTestnet.id });
  }, [switchChain]);

  return (
    <>
      <div className={`min-h-screen`}>
        <main className="relative flex flex-col flex-1">{children}</main>
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider enableSystem>
      <MiniAppProvider addMiniAppOnLoad={false}>
        <ProgressBar height="3px" color="#2299dd" />
        <ScaffoldEthApp>
          <Eruda>{children}</Eruda>
        </ScaffoldEthApp>
      </MiniAppProvider>
    </ThemeProvider>
  );
}
