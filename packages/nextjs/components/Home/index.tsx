"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useMiniApp } from "../contexts/miniapp-context";
import { sdk } from "@farcaster/frame-sdk";
import { parseEther } from "viem";
import { useAccount, useChainId, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useSignIn } from "~~/hooks/use-sign-in";
import { fetchUserByUsername } from "~~/utils/neynar";
import { sendFrameNotification } from "~~/utils/notifs";
import { notification } from "~~/utils/scaffold-eth";
import { truncateAddress } from "~~/utils/truncate";

export default function Home() {
  const { signIn, isLoading, isSignedIn, user } = useSignIn({
    autoSignIn: true,
  });
  const { addMiniApp, notificationDetails } = useMiniApp();
  const [username, setUsername] = useState<string>("");
  const [sendNotificationResult, setSendNotificationResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [value, setValue] = useState<string>("");

  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const { connect, connectors } = useConnect();

  useEffect(() => {
    connect({ connector: connectors[0] });
  }, [user]);

  const { address: connectedAddress } = useAccount();
  const [isFetching, setIsFetching] = useState(false);
  const [txResults, setTxResults] = useState<string[]>([]);

  const { sendTransactionAsync, data, error: sendTxError, isError: isSendTxError } = useSendTransaction();

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: data,
  });

  const { data: greeting } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "greeting",
  });

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  const handleSend = useCallback(() => {
    const handleBatchTransactions = async () => {
      if (!connectedAddress) return;

      setIsFetching(true);
      setTxResults([]);

      switchChain({ chainId: monadTestnet.id });
      try {
        const tx = await sendTransactionAsync({
          to: connectedAddress, // Sending to self for demo
          value: parseEther("0.0001"),
        });
        console.log("hash", tx);
        notification.success("Transaction sent");
        setTxResults([tx]);
      } catch (error) {
        console.error("Error sending batch transactions:", error);
        alert("Error sending batch transactions. Check console for details.");
      } finally {
        setIsFetching(false);
      }
    };
    handleBatchTransactions();
  }, [connectedAddress, sendTransactionAsync]);

  const sendNotification = useCallback(async () => {
    setSendNotificationResult("");
    if (!user) {
      console.log("No notification details or user");
      return;
    }

    try {
      const response = await sendFrameNotification({
        fid: Number(user.fid),
        title: "Test Notification",
        body: "This is a test notification",
      });

      if (response.state === "error") {
        setSendNotificationResult(`Error: ${response.error}`);
        return;
      }

      if (response.state === "rate_limit") {
        setSendNotificationResult("Rate limited - please try again later");
        return;
      }

      if (response.state === "no_token") {
        setSendNotificationResult("Notification token is invalid - please re-enable notifications");
        return;
      }

      setSendNotificationResult("Success");
    } catch (error) {
      setSendNotificationResult(`Error: ${error}`);
    }
  }, [user, notificationDetails]);

  const handleViewProfile = useCallback(async () => {
    if (!username) return;
    const user = await fetchUserByUsername(username);
    sdk.actions.viewProfile({ fid: Number(user.fid) });
  }, [username]);

  const updateGreeting = useCallback(async () => {
    try {
      if (!value) {
        notification.error("Please enter a value");
        return;
      }

      switchChain({ chainId: monadTestnet.id });

      await writeContractAsync(
        {
          functionName: "setGreeting",
          args: [value],
          value: parseEther("0.0001"),
        },
        {
          onSuccess: tx => {
            notification.success("Greeting updated");
            console.log("tx", tx);
            setTxResults([tx]);
          },
        },
      );
    } catch (error) {
      console.error("Error updating greeting:", error);
      notification.error("Error updating greeting");
    }
  }, [writeContractAsync]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-black bg-white">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Welcome</h1>
        <p className="text-lg text-muted-foreground">{isSignedIn ? "You are signed in!" : "Sign in to get started"}</p>
        <p className="text-lg text-muted-foreground">
          {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "No address found"}
        </p>

        {!isSignedIn ? (
          <button
            onClick={signIn}
            disabled={isLoading}
            className="px-6 py-3 font-semibold text-white transition-colors duration-200 bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        ) : (
          <div className="space-y-4">
            {user && (
              <div className="flex flex-col items-center space-y-2">
                <Image src={user.pfp_url} alt="Profile" className="w-20 h-20 rounded-full" width={80} height={80} />
                <div className="text-center">
                  <p className="font-semibold">{user.display_name}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
            )}

            {isConfirmed && (
              <div>
                <p>Transaction confirmed</p>
                <ul>
                  {txResults.map((hash, index) => (
                    <li key={index}>{truncateAddress(hash)}</li>
                  ))}
                </ul>
              </div>
            )}

            {isSendTxError && <div>Error: {sendTxError?.message}</div>}
            <button
              className="px-6 py-3 font-semibold text-white transition-colors duration-200 bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSend}
              disabled={isFetching}
            >
              {isFetching ? "Sending..." : "Send"}
            </button>

            <button
              onClick={() => {
                sdk.actions.openUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
              }}
              className="px-6 py-3 font-semibold text-white transition-colors duration-200 bg-red-600 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Open URL
            </button>

            <div className="mb-4">
              <button
                onClick={async () => {
                  if (user?.fid) {
                    const shareUrl = `${process.env.NEXT_PUBLIC_URL}/share/${user.fid}`;
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                disabled={!user?.fid}
              >
                {copied ? "Copied!" : "Copy share URL"}
              </button>
            </div>

            <input
              type="text"
              value={username}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              onChange={e => setUsername(e.target.value)}
            />
            <button onClick={handleViewProfile}>View Profile</button>

            {!notificationDetails && (
              <button
                onClick={addMiniApp}
                className="px-6 py-3 font-semibold text-white transition-colors duration-200 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Enable Notifications
              </button>
            )}

            {sendNotificationResult && (
              <div className="mb-2 text-sm">Send notification result: {sendNotificationResult}</div>
            )}
            <button
              onClick={() => {
                sendNotification();
              }}
              disabled={!notificationDetails}
              className="px-6 py-3 font-semibold text-white transition-colors duration-200 bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Notification
            </button>

            <button
              onClick={() => {
                sdk.actions.close();
              }}
              className="px-6 py-3 font-semibold text-white transition-colors duration-200 bg-red-600 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Close
            </button>

            {greeting && <div>Greeting: {greeting}</div>}

            <input
              type="text"
              value={value}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              onChange={e => setValue(e.target.value)}
            />
            <button
              onClick={updateGreeting}
              className="px-6 py-3 font-semibold text-white transition-colors duration-200 bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              Set Greeting
            </button>

            {chainId && (
              <div className="my-2 text-xs">
                Chain ID: <pre className="inline">{chainId}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
