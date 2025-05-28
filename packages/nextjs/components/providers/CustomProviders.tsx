"use client";

import React, { ReactNode } from "react";
import { Eruda } from "../Eruda/ErudaProvider";
import { Footer } from "../UI/Footer";
import { Header } from "../UI/Header";
import { MiniAppProvider } from "../contexts/miniapp-context";
import { QueryClient } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "~~/components/providers/ThemeProvider";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { useFrameWallet } from "~~/hooks/useFrameWallet";

interface ProvidersProps {
  children: ReactNode;
}

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();
  useFrameWallet();

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
          <Eruda>
            <Header />
            {children}
            <Footer />
          </Eruda>
        </ScaffoldEthApp>
      </MiniAppProvider>
    </ThemeProvider>
  );
}
