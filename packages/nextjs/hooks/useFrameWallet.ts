import { useEffect } from "react";
import { useConnect, useSwitchChain } from "wagmi";
import { monadTestnet } from "wagmi/chains";

/**
 * Hook to handle Frame wallet connection and chain switching
 * @returns Object containing connection status and error if any
 */
export const useFrameWallet = () => {
  const { connect, connectors, error: connectError } = useConnect();
  const { switchChain, error: switchError } = useSwitchChain();

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

  return {
    error: connectError || switchError,
  };
};
