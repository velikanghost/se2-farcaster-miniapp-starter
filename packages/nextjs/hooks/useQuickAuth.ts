import { useCallback, useEffect, useState } from "react";
import { useMiniApp } from "~~/components/contexts/miniapp-context";

export interface QuickAuthUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  custodyAddress: string;
  verifications: string[];
}

export const useQuickAuth = ({ autoSignIn = false }: { autoSignIn?: boolean } = {}) => {
  const { context, isMiniAppReady } = useMiniApp();

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<QuickAuthUser | null>(null);

  // Extract user data from Frame SDK context
  const extractUserFromContext = useCallback((context: any): QuickAuthUser | null => {
    if (!context?.user) return null;

    return {
      fid: context.user.fid,
      username: context.user.username || "",
      displayName: context.user.displayName || "",
      pfpUrl: context.user.pfpUrl || "",
      custodyAddress: context.user.custodyAddress || "",
      verifications: context.user.verifications || [],
    };
  }, []);

  // Quick Auth sign in - no external API calls needed
  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!context) {
        throw new Error("No Farcaster context available");
      }

      if (!context.user) {
        throw new Error("No user data in Farcaster context");
      }

      // Extract user data directly from Frame SDK context
      const userData = extractUserFromContext(context);

      if (!userData) {
        throw new Error("Failed to extract user data");
      }

      setUser(userData);
      setIsSignedIn(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Quick Auth failed";
      setError(errorMessage);
      console.error("Quick Auth error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [context, extractUserFromContext]);

  // Auto sign in when context is ready
  useEffect(() => {
    if (autoSignIn && isMiniAppReady && context?.user && !isSignedIn) {
      signIn();
    }
  }, [autoSignIn, isMiniAppReady, context, isSignedIn, signIn]);

  // Update user data when context changes
  useEffect(() => {
    if (context?.user && isSignedIn) {
      const userData = extractUserFromContext(context);
      if (userData) {
        setUser(userData);
      }
    }
  }, [context, isSignedIn, extractUserFromContext]);

  return {
    signIn,
    isSignedIn,
    isLoading: isLoading || !isMiniAppReady,
    error,
    user,
  };
};
