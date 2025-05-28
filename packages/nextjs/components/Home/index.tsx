"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useMiniApp } from "../contexts/miniapp-context";
import { sdk } from "@farcaster/frame-sdk";
import { parseEther } from "viem";
import { useAccount, useChainId, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useSignIn } from "~~/hooks/useSignIn";
import { fetchUserByUsername } from "~~/utils/neynar";
import { sendFrameNotification } from "~~/utils/notifs";
import { notification } from "~~/utils/scaffold-eth";
import { truncateAddress } from "~~/utils/truncateAddress";

export default function Home() {
  const { signIn, isLoading, isSignedIn, user } = useSignIn({
    autoSignIn: true,
  });
  const { addMiniApp, context } = useMiniApp();
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [username, setUsername] = useState<string>("");
  const [sendNotificationResult, setSendNotificationResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [value, setValue] = useState<string>("");
  const [isFetching, setIsFetching] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
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

  const handleSend = useCallback(async () => {
    if (!connectedAddress) return;

    try {
      setIsFetching(true);
      setTxResults([]);

      switchChain({ chainId: monadTestnet.id });

      const tx = await sendTransactionAsync({
        to: connectedAddress,
        value: parseEther("0.0001"),
      });

      setTxResults([tx]);
      notification.success("Transaction sent");
    } catch (error) {
      console.error("Error sending transaction:", error);
      notification.error("Error sending transaction");
      setIsFetching(false);
    } finally {
      setIsFetching(false);
    }
  }, [connectedAddress, sendTransactionAsync]);

  const sendNotification = useCallback(async () => {
    if (!user) {
      console.log("No user available");
      return;
    }

    setIsWaiting(true);
    setSendNotificationResult("");

    try {
      const response = await sendFrameNotification({
        fid: Number(user.fid),
        title: "Test Notification",
        body: "This is a test notification",
      });

      setIsWaiting(false);

      switch (response.state) {
        case "error":
          setSendNotificationResult(`Error: ${response.error}`);
          break;
        case "rate_limit":
          setSendNotificationResult("Rate limited - please try again later");
          break;
        case "no_token":
          setSendNotificationResult("Notification token is invalid - please re-enable notifications");
          break;
        case "success":
          setSendNotificationResult("Success");
          break;
      }
    } catch (error) {
      setSendNotificationResult(`Error: ${error}`);
      console.log("Error sending notification:", error);
      setIsWaiting(false);
    }
  }, [user]);

  const handleViewProfile = async () => {
    if (!username) return;
    try {
      const user = await fetchUserByUsername(username);
      await sdk.actions.viewProfile({ fid: Number(user.fid) });
    } catch (error) {
      notification.error("Failed to view profile");
    }
  };

  const updateGreeting = useCallback(async () => {
    if (!value) {
      notification.error("Please enter a value");
      return;
    }

    switchChain({ chainId: monadTestnet.id });

    try {
      await writeContractAsync(
        {
          functionName: "setGreeting",
          args: [value],
          value: parseEther("0.0001"),
        },
        {
          onSuccess: tx => {
            notification.success("Greeting updated");
            setTxResults([tx]);
          },
        },
      );
    } catch (error) {
      console.error("Error updating greeting:", error);
      notification.error("Error updating greeting");
    }
  }, [value, writeContractAsync]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="w-full max-w-2xl p-6 space-y-4">
        {/* Header Section */}
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            Scaffold-ETH 2 + Farcaster Mini-App
          </h1>
          <p className="text-xl text-gray-600">
            {isSignedIn ? "Connected to Farcaster" : "Connect your Farcaster account to get started"}
          </p>
          {connectedAddress && (
            <div className="inline-block px-4 py-1 bg-gray-100 rounded-full">
              <p className="font-mono text-sm text-gray-600">{truncateAddress(connectedAddress)}</p>
            </div>
          )}
        </div>

        {/* Sign In Button - Primary Action */}
        {!isSignedIn ? (
          <div className="flex justify-center">
            <button
              onClick={signIn}
              disabled={isLoading}
              className="px-8 py-4 text-lg font-semibold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="space-y-2">
            {/* User Profile Section */}
            {user && (
              <div className="flex flex-col items-center p-4 space-y-3 bg-white shadow-md rounded-2xl">
                <div className="relative w-20 h-20">
                  <Image src={user.pfp_url} alt="Profile" className="w-20 h-20 rounded-full" width={80} height={80} />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 border-4 border-white rounded-full"></div>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800">{user.display_name}</h2>
                  <p className="text-gray-500">@{user.username}</p>
                </div>
              </div>
            )}

            {/* Primary Actions - Indigo */}
            <button
              onClick={handleSend}
              disabled={isFetching}
              className="w-full px-6 py-3 font-semibold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetching ? "Sending..." : "Send MON"}
            </button>

            {/* Secondary Actions - Purple */}
            <button
              onClick={() => sdk.actions.openUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")}
              className="w-full px-6 py-3 mt-4 font-semibold text-white transition-all duration-200 bg-purple-600 rounded-xl hover:bg-purple-700 hover:shadow-lg"
            >
              Open External URL
            </button>

            {/* Tertiary Actions - Outlined */}
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
              className="w-full px-6 py-3 font-semibold text-indigo-600 transition-all duration-200 border-2 border-indigo-200 rounded-xl hover:bg-indigo-50"
            >
              {copied ? "✓ Copied!" : "Copy App Share URL"}
            </button>

            {/* Profile View Section */}
            <div className="flex flex-col gap-3 mt-4">
              <input
                type="text"
                value={username}
                placeholder="Enter username"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={e => setUsername(e.target.value)}
              />
              <button
                onClick={handleViewProfile}
                className="w-full px-6 py-3 text-white transition-all duration-200 bg-violet-600 rounded-xl hover:bg-violet-700 hover:shadow-lg"
              >
                View Profile
              </button>
            </div>

            {/* Notifications Section */}
            <div className="mt-4 space-y-2">
              {!context?.client?.added && (
                <button
                  onClick={addMiniApp}
                  className="w-full px-6 py-3 font-semibold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-700 hover:shadow-lg"
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
                disabled={!context?.client?.added || isWaiting}
                className="w-full px-6 py-3 font-semibold text-white transition-all duration-200 bg-purple-600 rounded-xl hover:bg-purple-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isWaiting ? "Sending..." : "Send Test Notification"}
              </button>
            </div>

            {/* Transaction Status Section */}
            {isConfirmed && (
              <div className="p-4 border border-green-200 bg-green-50 rounded-xl">
                <h3 className="font-semibold text-green-800">Transaction Confirmed</h3>
                <ul className="mt-2 space-y-1">
                  {txResults.map((hash, index) => (
                    <li
                      onClick={() => {
                        navigator.clipboard.writeText(hash);
                        notification.success("Copied");
                      }}
                      key={index}
                      className="font-mono text-sm text-green-600 cursor-pointer"
                    >
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

            {/* Greeting Section */}
            <div className="space-y-3">
              <h4 className="mt-4 text-xl font-semibold">Contract Interaction</h4>
              {greeting && (
                <div className="p-4 border border-gray-200 bg-gray-50 rounded-xl">
                  <p className="text-gray-600">Current Greeting:</p>
                  <p className="text-lg font-semibold">{greeting}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={value}
                  placeholder="Enter new greeting"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onChange={e => setValue(e.target.value)}
                />
                <button
                  onClick={updateGreeting}
                  className="px-6 py-2 text-white transition-all duration-200 bg-violet-600 rounded-xl hover:bg-violet-700 hover:shadow-lg"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Chain Info & Close Button */}
            <div className="flex flex-col items-center space-y-3">
              {chainId && (
                <div className="w-full px-4 py-1 bg-gray-100 rounded-full">
                  <p className="my-1 font-mono text-sm text-gray-600">Chain ID: {chainId}</p>
                </div>
              )}

              {/* Danger Action */}
              <button
                onClick={() => sdk.actions.close()}
                className="w-full px-6 py-3 font-semibold transition-all duration-200 border-2 text-rose-600 border-rose-200 rounded-xl hover:bg-rose-50"
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
