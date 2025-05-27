"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import FrameWalletProvider from "./frame-wallet-context";
import { Context, FrameNotificationDetails, sdk } from "@farcaster/frame-sdk";

interface MiniAppContextType {
  isMiniAppReady: boolean;
  context: Context.FrameContext | null;
  setMiniAppReady: () => void;
  addMiniApp: () => Promise<any | null>;
  notificationDetails: FrameNotificationDetails | null;
}

const MiniAppContext = createContext<MiniAppContextType | undefined>(undefined);

export function MiniAppProvider({ addMiniAppOnLoad, children }: { addMiniAppOnLoad?: boolean; children: ReactNode }) {
  const [context, setContext] = useState<Context.FrameContext | null>(null);
  const [isMiniAppReady, setIsMiniAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationDetails, setNotificationDetails] = useState<FrameNotificationDetails | null>(null);

  const setMiniAppReady = useCallback(async () => {
    try {
      const context = await sdk.context;
      if (context) {
        setContext(context as Context.FrameContext);
      } else {
        setError("Failed to load Farcaster context");
      }
      await sdk.actions.ready();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize SDK");
      console.error("SDK initialization error:", err);
    } finally {
      setIsMiniAppReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady().then(() => {
        console.log("MiniApp loaded");
      });
    }
  }, [isMiniAppReady, setMiniAppReady]);

  const handleAddMiniApp = useCallback(async () => {
    try {
      const result = await sdk.actions.addFrame();
      if (result.notificationDetails) {
        console.log("addFrame result:", result);
        setNotificationDetails(result.notificationDetails);

        await fetch("/api/send-notification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: result.notificationDetails.token,
            url: result.notificationDetails.url,
            targetUrl: window.location.origin,
            fid: context?.user?.fid,
          }),
        });
      }
      if (result) {
        return result;
      }
      return null;
    } catch (error) {
      console.error("[error] adding frame", error);
      return null;
    }
  }, [context]);

  useEffect(() => {
    // on load, set the frame as ready
    if (isMiniAppReady && !context?.client?.added && addMiniAppOnLoad) {
      handleAddMiniApp();
    }
  }, [isMiniAppReady, context?.client?.added, handleAddMiniApp, addMiniAppOnLoad]);

  return (
    <MiniAppContext.Provider
      value={{
        isMiniAppReady,
        setMiniAppReady,
        addMiniApp: handleAddMiniApp,
        context,
        notificationDetails,
      }}
    >
      <FrameWalletProvider>{children}</FrameWalletProvider>
    </MiniAppContext.Provider>
  );
}

export function useMiniApp() {
  const context = useContext(MiniAppContext);
  if (context === undefined) {
    throw new Error("useMiniApp must be used within a MiniAppProvider");
  }
  return context;
}
