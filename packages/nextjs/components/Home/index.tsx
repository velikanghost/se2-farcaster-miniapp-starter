"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useMiniApp } from "../contexts/miniapp-context";
import { sdk } from "@farcaster/frame-sdk";
import { parseEther } from "viem";
import {
  useAccount,
  useChainId,
  useConnect,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
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
    const handleTransaction = async () => {
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
        console.error("Error sending transaction:", error);
        notification.error("Error sending transaction");
      } finally {
        setIsFetching(false);
      }
    };
    handleTransaction();
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="w-full max-w-2xl p-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-4 text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            Farcaster Mini App
          </h1>
          <p className="text-lg text-gray-600">
            {isSignedIn ? "Connected to Farcaster" : "Connect your Farcaster account to get started"}
          </p>
          {address && (
            <div className="inline-block px-4 py-2 bg-gray-100 rounded-full">
              <p className="font-mono text-sm text-gray-600">
                {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ""}
              </p>
            </div>
          )}
        </div>

        {/* Sign In Button */}
        {!isSignedIn ? (
          <div className="flex justify-center">
            <button
              onClick={signIn}
              disabled={isLoading}
              className="px-8 py-4 text-lg font-semibold text-white transition-all duration-200 bg-purple-600 rounded-xl hover:bg-purple-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Connecting...</span>
                </span>
              ) : (
                "Connect with Farcaster"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* User Profile Section */}
            {user && (
              <div className="flex flex-col items-center p-6 space-y-4 bg-white shadow-md rounded-2xl">
                <div className="relative">
                  <Image
                    src={user.pfp_url}
                    alt="Profile"
                    className="rounded-full ring-4 ring-purple-100"
                    width={100}
                    height={100}
                  />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 border-4 border-white rounded-full"></div>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800">{user.display_name}</h2>
                  <p className="text-gray-500">@{user.username}</p>
                </div>
              </div>
            )}

            {/* Transaction Status Section */}
            {isConfirmed && (
              <div className="p-4 border border-green-200 bg-green-50 rounded-xl">
                <h3 className="font-semibold text-green-800">Transaction Confirmed</h3>
                <ul className="mt-2 space-y-1">
                  {txResults.map((hash, index) => (
                    <li key={index} className="font-mono text-sm text-green-600">
                      {truncateAddress(hash)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isSendTxError && (
              <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
                <p className="text-red-600">Error: {sendTxError?.message}</p>
              </div>
            )}

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                onClick={handleSend}
                disabled={isFetching}
                className="px-6 py-3 font-semibold text-white transition-all duration-200 bg-purple-600 rounded-xl hover:bg-purple-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? "Sending..." : "Send Transaction"}
              </button>

              <button
                onClick={() => sdk.actions.openUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")}
                className="px-6 py-3 font-semibold text-white transition-all duration-200 bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg"
              >
                Open URL
              </button>
            </div>

            {/* Share URL Section */}
            <div className="flex justify-center">
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
                className="px-6 py-3 text-purple-600 transition-colors duration-200 border-2 border-purple-200 rounded-xl hover:bg-purple-50"
              >
                {copied ? "✓ Copied!" : "Copy Share URL"}
              </button>
            </div>

            {/* Profile View Section */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={username}
                placeholder="Enter username"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                onChange={e => setUsername(e.target.value)}
              />
              <button
                onClick={handleViewProfile}
                className="px-6 py-2 text-white transition-colors duration-200 bg-gray-800 rounded-xl hover:bg-gray-900"
              >
                View Profile
              </button>
            </div>

            {/* Notifications Section */}
            <div className="space-y-4">
              {!notificationDetails && (
                <button
                  onClick={addMiniApp}
                  className="w-full px-6 py-3 font-semibold text-white transition-all duration-200 bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg"
                >
                  Enable Notifications
                </button>
              )}

              {sendNotificationResult && (
                <div
                  className={`p-4 rounded-xl ${
                    sendNotificationResult === "Success" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {sendNotificationResult}
                </div>
              )}

              <button
                onClick={sendNotification}
                disabled={!notificationDetails}
                className="w-full px-6 py-3 font-semibold text-white transition-all duration-200 bg-purple-600 rounded-xl hover:bg-purple-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Test Notification
              </button>
            </div>

            {/* Greeting Section */}
            <div className="space-y-4">
              {greeting && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-600">Current Greeting:</p>
                  <p className="text-lg font-semibold">{greeting}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={value}
                  placeholder="Enter new greeting"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onChange={e => setValue(e.target.value)}
                />
                <button
                  onClick={updateGreeting}
                  className="px-6 py-2 text-white transition-colors duration-200 bg-purple-600 rounded-xl hover:bg-purple-700"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Chain Info & Close Button */}
            <div className="flex flex-col items-center space-y-4">
              {chainId && (
                <div className="px-4 py-2 bg-gray-100 rounded-full">
                  <p className="font-mono text-sm text-gray-600">Chain ID: {chainId}</p>
                </div>
              )}

              <button
                onClick={() => sdk.actions.close()}
                className="px-6 py-3 text-red-600 transition-colors duration-200 border-2 border-red-200 rounded-xl hover:bg-red-50"
              >
                Close Mini App
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
