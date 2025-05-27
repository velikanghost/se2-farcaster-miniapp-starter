// 'use client'

// import { useCallback, useEffect, useMemo, useState } from 'react'
// import { useSignIn } from "@/hooks/use-sign-in";
// import sdk, { SignIn as SignInCore } from '@farcaster/frame-sdk'
// import {
//   useAccount,
//   useSendTransaction,
//   useSignMessage,
//   useSignTypedData,
//   useWaitForTransactionReceipt,
//   useDisconnect,
//   useConnect,
//   useSwitchChain,
//   useChainId,
// } from 'wagmi'
// // import {
// //   useConnection as useSolanaConnection,
// //   useWallet as useSolanaWallet,
// // } from '@solana/wallet-adapter-react'
// // import { useHasSolanaProvider } from './providers/SafeFarcasterSolanaProvider'

// //import { config } from '~/components/providers/WagmiProvider'
// import { base, degen, mainnet, optimism, unichain } from 'wagmi/chains'
// import { BaseError, UserRejectedRequestError } from 'viem'
// import {truncateAddress} from '@/lib/truncate';
// //import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'

// export default function Demo(
//   { title }: { title?: string } = { title: 'Frames v2 Demo' },
// ) {
//   const {
//     isSDKLoaded,
//     context,
//     added,
//     notificationDetails,
//     lastEvent,
//     addFrame,
//     addFrameResult,
//     openUrl,
//     close,
//   } = useFrame()
//   const [isContextOpen, setIsContextOpen] = useState(false)
//   const [txHash, setTxHash] = useState<string | null>(null)
//   const [sendNotificationResult, setSendNotificationResult] = useState('')
//   const [copied, setCopied] = useState(false)

//   const { address, isConnected } = useAccount()
//   const chainId = useChainId()
//   const hasSolanaProvider = useHasSolanaProvider()
//   let solanaWallet, solanaPublicKey, solanaSignMessage, solanaAddress
//   if (hasSolanaProvider) {
//     solanaWallet = useSolanaWallet()
//     ;({ publicKey: solanaPublicKey, signMessage: solanaSignMessage } =
//       solanaWallet)
//     solanaAddress = solanaPublicKey?.toBase58()
//   }

//   useEffect(() => {
//     console.log('isSDKLoaded', isSDKLoaded)
//     console.log('context', context)
//     console.log('address', address)
//     console.log('isConnected', isConnected)
//     console.log('chainId', chainId)
//   }, [context, address, isConnected, chainId, isSDKLoaded])

//   const {
//     switchChain
//   } = useSwitchChain()

//   const nextChain = useMemo(() => {
//     if (chainId === base.id) {
//       return optimism
//     } else if (chainId === optimism.id) {
//       return degen
//     } else if (chainId === degen.id) {
//       return mainnet
//     } else if (chainId === mainnet.id) {
//       return unichain
//     } else {
//       return base
//     }
//   }, [chainId])

//   const handleSwitchChain = useCallback(() => {
//     switchChain({ chainId: nextChain.id })
//   }, [switchChain, nextChain.id])

//   const sendNotification = useCallback(async () => {
//     setSendNotificationResult('')
//     if (!notificationDetails || !context) {
//       return
//     }

//     try {
//       const response = await fetch('/api/send-notification', {
//         method: 'POST',
//         mode: 'same-origin',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           fid: context.user.fid,
//           notificationDetails,
//         }),
//       })

//       if (response.status === 200) {
//         setSendNotificationResult('Success')
//         return
//       } else if (response.status === 429) {
//         setSendNotificationResult('Rate limited')
//         return
//       }

//       const data = await response.text()
//       setSendNotificationResult(`Error: ${data}`)
//     } catch (error) {
//       setSendNotificationResult(`Error: ${error}`)
//     }
//   }, [context, notificationDetails])

//   const toggleContext = useCallback(() => {
//     setIsContextOpen((prev) => !prev)
//   }, [])

//   if (!isSDKLoaded) {
//     return <div>Loading...</div>
//   }

//   return (
//     <div
//       style={{
//         paddingTop: context?.client.safeAreaInsets?.top ?? 0,
//         paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
//         paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
//         paddingRight: context?.client.safeAreaInsets?.right ?? 0,
//       }}
//     >
//       <div className="w-[300px] mx-auto py-2 px-2">
//         <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

//         <div className="mb-4">
//           <h2 className="font-2xl font-bold">Context</h2>
//           <button
//             onClick={toggleContext}
//             className="flex items-center gap-2 transition-colors"
//           >
//             <span
//               className={`transform transition-transform ${
//                 isContextOpen ? 'rotate-90' : ''
//               }`}
//             >
//               ➤
//             </span>
//             Tap to expand
//           </button>

//           {isContextOpen && (
//             <div className="p-4 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
//               <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
//                 {JSON.stringify(context, null, 2)}
//               </pre>
//             </div>
//           )}
//         </div>

//         <div className="mb-4">
//           <h2 className="font-2xl font-bold">Last event</h2>

//           <div className="p-4 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
//             <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
//               {lastEvent || 'none'}
//             </pre>
//           </div>
//         </div>

//         <div>
//           <h2 className="font-2xl font-bold">Add to client & notifications</h2>

//           <div className="mt-2 mb-4 text-sm">
//             Client fid {context?.client.clientFid},
//             {added ? ' frame added to client,' : ' frame not added to client,'}
//             {notificationDetails
//               ? ' notifications enabled'
//               : ' notifications disabled'}
//           </div>

//           <div className="mb-4">
//             <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
//               <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
//                 sdk.actions.addFrame
//               </pre>
//             </div>
//             {addFrameResult && (
//               <div className="mb-2 text-sm">
//                 Add frame result: {addFrameResult}
//               </div>
//             )}
//             <button onClick={addFrame} disabled={added}>
//               Add frame to client
//             </button>
//           </div>

//           {sendNotificationResult && (
//             <div className="mb-2 text-sm">
//               Send notification result: {sendNotificationResult}
//             </div>
//           )}
//           <div className="mb-4">
//             <button onClick={sendNotification} disabled={!notificationDetails}>
//               Send notification
//             </button>
//           </div>

//           <div className="mb-4">
//             <button
//               onClick={async () => {
//                 if (context?.user?.fid) {
//                   const shareUrl = `${process.env.NEXT_PUBLIC_URL}/share/${context.user.fid}`
//                   await navigator.clipboard.writeText(shareUrl)
//                   setCopied(true)
//                   setTimeout(() => setCopied(false), 2000)
//                 }
//               }}
//               disabled={!context?.user?.fid}
//             >
//               {copied ? 'Copied!' : 'Copy share URL'}
//             </button>
//           </div>
//         </div>

//         {solanaAddress && (
//           <div>
//             <h2 className="font-2xl font-bold">Solana</h2>
//             <div className="my-2 text-xs">
//               Address:{' '}
//               <pre className="inline">{truncateAddress(solanaAddress)}</pre>
//             </div>
//             <SignSolanaMessage signMessage={solanaSignMessage} />
//             <div className="mb-4">
//               <SendSolana />
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// // Solana functions inspired by farcaster demo
// // https://github.com/farcasterxyz/frames-v2-demo/blob/main/src/components/Demo.tsx
// function SignSolanaMessage({
//   signMessage,
// }: {
//   signMessage?: (message: Uint8Array) => Promise<Uint8Array>
// }) {
//   const [signature, setSignature] = useState<string | undefined>()
//   const [signError, setSignError] = useState<Error | undefined>()
//   const [signPending, setSignPending] = useState(false)

//   const handleSignMessage = useCallback(async () => {
//     setSignPending(true)
//     try {
//       if (!signMessage) {
//         throw new Error('no Solana signMessage')
//       }
//       const input = new TextEncoder().encode('Hello from Solana!')
//       const signatureBytes = await signMessage(input)
//       const signature = btoa(String.fromCharCode(...signatureBytes))
//       setSignature(signature)
//       setSignError(undefined)
//     } catch (e) {
//       if (e instanceof Error) {
//         setSignError(e)
//       }
//     } finally {
//       setSignPending(false)
//     }
//   }, [signMessage])

//   return (
//     <>
//       <button
//         onClick={handleSignMessage}
//         disabled={signPending}
//         className="mb-4"
//       >
//         Sign Message
//       </button>
//       {signature && (
//         <div className="mt-2 text-xs">
//           <div>Signature: {signature}</div>
//         </div>
//       )}
//     </>
//   )
// }

// function SendSolana() {
//   const [state, setState] = useState<
//     | { status: 'none' }
//     | { status: 'pending' }
//     | { status: 'error'; error: Error }
//     | { status: 'success'; signature: string }
//   >({ status: 'none' })

//   const { connection: solanaConnection } = useSolanaConnection()
//   const { sendTransaction, publicKey } = useSolanaWallet()

//   // This should be replaced but including it from the original demo
//   // https://github.com/farcasterxyz/frames-v2-demo/blob/main/src/components/Demo.tsx#L718
//   const ashoatsPhantomSolanaWallet =
//     'Ao3gLNZAsbrmnusWVqQCPMrcqNi6jdYgu8T6NCoXXQu1'

//   const handleSend = useCallback(async () => {
//     setState({ status: 'pending' })
//     try {
//       if (!publicKey) {
//         throw new Error('no Solana publicKey')
//       }

//       const { blockhash } = await solanaConnection.getLatestBlockhash()
//       if (!blockhash) {
//         throw new Error('failed to fetch latest Solana blockhash')
//       }

//       const fromPubkeyStr = publicKey.toBase58()
//       const toPubkeyStr = ashoatsPhantomSolanaWallet
//       const transaction = new Transaction()
//       transaction.add(
//         SystemProgram.transfer({
//           fromPubkey: new PublicKey(fromPubkeyStr),
//           toPubkey: new PublicKey(toPubkeyStr),
//           lamports: 0n,
//         }),
//       )
//       transaction.recentBlockhash = blockhash
//       transaction.feePayer = new PublicKey(fromPubkeyStr)

//       const simulation = await solanaConnection.simulateTransaction(transaction)
//       if (simulation.value.err) {
//         // Gather logs and error details for debugging
//         const logs = simulation.value.logs?.join('\n') ?? 'No logs'
//         const errDetail = JSON.stringify(simulation.value.err)
//         throw new Error(`Simulation failed: ${errDetail}\nLogs:\n${logs}`)
//       }
//       const signature = await sendTransaction(transaction, solanaConnection)
//       setState({ status: 'success', signature })
//     } catch (e) {
//       if (e instanceof Error) {
//         setState({ status: 'error', error: e })
//       } else {
//         setState({ status: 'none' })
//       }
//     }
//   }, [sendTransaction, publicKey, solanaConnection])

//   return (
//     <>
//       <button
//         onClick={handleSend}
//         disabled={state.status === 'pending'}
//         className="mb-4"
//       >
//         Send Transaction (sol)
//       </button>
//       {state.status === 'success' && (
//         <div className="mt-2 text-xs">
//           <div>Hash: {truncateAddress(state.signature)}</div>
//         </div>
//       )}
//     </>
//   )
// }
