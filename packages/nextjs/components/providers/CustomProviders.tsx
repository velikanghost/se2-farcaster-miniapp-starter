"use client";

import React, { ReactNode } from "react";
import { Eruda } from "../Eruda/ErudaProvider";
import { MiniAppProvider } from "../contexts/miniapp-context";
import { ScaffoldEthAppWithProviders } from "~~/components/providers/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/providers/ThemeProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider enableSystem>
      <MiniAppProvider addMiniAppOnLoad={false}>
        <ScaffoldEthAppWithProviders>
          <Eruda>{children}</Eruda>
        </ScaffoldEthAppWithProviders>
      </MiniAppProvider>
    </ThemeProvider>
  );
}
