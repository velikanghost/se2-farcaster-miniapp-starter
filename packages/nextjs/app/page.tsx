import { Metadata } from "next";
import App from "~~/components/App";
import { APP_URL } from "~~/utils/constants";

const frame = {
  version: "next",
  imageUrl: `${APP_URL}/images/feed.png`,
  button: {
    title: "Launch App",
    action: {
      type: "launch_frame",
      name: "Mini-app Starter",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Mini-app Starter",
    openGraph: {
      title: "Mini-app Starter",
      description: "A Mini-app Starter",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}

// "use client";

// import { useState } from "react";
// import type { NextPage } from "next";
// import { createWalletClient, http, parseEther } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
// import { useAccount, usePublicClient } from "wagmi";
// import { Address } from "~~/components/scaffold-eth";
// import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

// const Home: NextPage = () => {
//   const { address: connectedAddress } = useAccount();
//   const publicClient = usePublicClient();
//   const { targetNetwork } = useTargetNetwork();
//   const [privateKey, setPrivateKey] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [batchSize, setBatchSize] = useState(10);
//   const [txResults, setTxResults] = useState<string[]>([]);
//   const [apiKey, setApiKey] = useState("");

//   const handleBatchTransactions = async () => {
//     if (!publicClient || !privateKey) return;

//     setIsLoading(true);
//     setTxResults([]);

//     try {
//       const privateKeyHex = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
//       const account = privateKeyToAccount(privateKeyHex as `0x${string}`);

//       const walletClient = createWalletClient({
//         chain: targetNetwork,
//         transport: http(`https://monad-testnet.g.alchemy.com/v2/${apiKey}`),
//         account,
//       });

//       const walletAddress = account.address;

//       const BATCH_SIZE = batchSize;
//       const nonce = await publicClient.getTransactionCount({ address: walletAddress });

//       const transactions = Array(BATCH_SIZE)
//         .fill(null)
//         .map(async (_, index) => {
//           return await walletClient.sendTransaction({
//             account,
//             to: walletAddress, // Sending to self for demo
//             value: parseEther("0.0001"), // 0.0001 MON
//             gasLimit: BigInt(21000), // 21000 gas limit
//             baseFeePerGas: BigInt(50000000000), // 50 gwei
//             chain: targetNetwork,
//             nonce: nonce + Number(index),
//           });
//         });

//       const hashes = await Promise.all(transactions);
//       console.log("Batch transaction hashes:", hashes);
//       setTxResults(hashes);
//       alert(`${BATCH_SIZE} batch transactions sent! Check console for hashes.`);
//     } catch (error) {
//       console.error("Error sending batch transactions:", error);
//       alert("Error sending batch transactions. Check console for details.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <>
//       <div className="flex flex-col items-center flex-grow pt-5">
//         <div className="px-5">
//           <h1 className="text-center">
//             <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
//             <span className="block mb-2 text-lg">Foundry Edition + Monad Testnet Config</span>
//             <span className="block mb-2 text-md">batch transactions example</span>
//           </h1>
//           <div className="flex flex-col items-center justify-center space-x-2 sm:flex-row">
//             <p className="my-2 font-medium">Connected Address:</p>
//             <Address address={connectedAddress} />
//           </div>

//           <div className="flex flex-col items-center w-full max-w-md gap-3 mx-auto mt-4">
//             <input
//               type="password"
//               placeholder="Enter Private Key"
//               className="w-full input input-bordered"
//               value={privateKey}
//               onChange={e => setPrivateKey(e.target.value)}
//             />
//             <div className="text-xs text-gray-500">
//               <div>Note: Never expose your private key in production. This is for demonstration purposes only.</div>
//               <div>Check packages/nextjs/page.tsx for the code.</div>
//             </div>

//             <input
//               type="text"
//               placeholder="Enter Alchemy API Key"
//               className="w-full input input-bordered"
//               value={apiKey}
//               onChange={e => setApiKey(e.target.value)}
//             />
//             <div className="text-xs text-gray-500">
//               Get your own API key for Monad Testnet from{" "}
//               <a
//                 href="https://www.alchemy.com/"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="link link-primary"
//               >
//                 Alchemy
//               </a>
//             </div>

//             <div className="w-full">
//               <label className="label">
//                 <span className="label-text">Batch Size: {batchSize}</span>
//               </label>
//               <input
//                 type="range"
//                 min="1"
//                 max="30"
//                 value={batchSize}
//                 onChange={e => setBatchSize(parseInt(e.target.value))}
//                 className="range range-primary"
//               />
//               <div className="flex justify-between w-full px-2 text-xs">
//                 <span>1</span>
//                 <span>10</span>
//                 <span>20</span>
//                 <span>30</span>
//               </div>
//             </div>

//             <div className="mt-2 text-sm text-center">
//               <p>
//                 <strong>Batch Size Considerations:</strong>
//               </p>
//               <ul className="pl-5 mt-1 text-left list-disc">
//                 <li>Maximum of 30 transactions to avoid API rate limits (429 errors)</li>
//                 <li>Each transaction requires a unique nonce</li>
//                 <li>You could submit more if you had an api with a larger request limit.</li>
//               </ul>
//             </div>

//             <button
//               className="w-full btn btn-primary"
//               onClick={handleBatchTransactions}
//               disabled={!publicClient || !privateKey || isLoading}
//             >
//               {isLoading ? <span className="loading loading-spinner loading-sm"></span> : null}
//               Send {batchSize} Batch Transactions
//             </button>

//             {txResults.length > 0 && (
//               <div className="w-full mt-4">
//                 <h3 className="mb-2 text-lg font-medium">Transaction Hashes:</h3>
//                 <div className="p-3 overflow-y-auto text-xs rounded-lg bg-base-300 max-h-40">
//                   {txResults.map((hash, index) => (
//                     <div key={index} className="mb-1">
//                       <span className="font-medium">{index + 1}:</span> {hash}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Home;
