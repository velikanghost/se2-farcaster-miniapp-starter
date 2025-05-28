import { useEffect, useState } from "react";
import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { monadTestnet } from "wagmi/chains";

/**
 * Hook to handle Frame wallet connection and chain switching
 * @returns Object containing connection status, success states and error if any
 */
export const useFrameWallet = () => {
  const { connect, connectors, error: connectError, isSuccess: isConnectSuccess } = useConnect();
  const { switchChain, error: switchError, isSuccess: isSwitchSuccess } = useSwitchChain();
  const { isConnected } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeWallet = async () => {
      if (!isConnected && connectors[0] && !isInitialized) {
        try {
          await connect({ connector: connectors[0] });
          setIsInitialized(true);
        } catch (error) {
          console.error("Failed to connect wallet:", error);
        }
      }
    };

    initializeWallet();
  }, [connect, connectors, isConnected, isInitialized]);

  useEffect(() => {
    const switchToMonad = async () => {
      if (isConnected && !isSwitchSuccess) {
        try {
          await switchChain({ chainId: monadTestnet.id });
        } catch (error) {
          console.error("Failed to switch chain:", error);
        }
      }
    };

    switchToMonad();
  }, [switchChain, isConnected, isSwitchSuccess]);

  return {
    error: connectError || switchError,
    isSuccess: isConnected && isSwitchSuccess,
    isConnected,
    isSwitchSuccess,
  };
};
