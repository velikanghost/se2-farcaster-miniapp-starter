import { NextRequest } from "next/server";
import { ParseWebhookEvent, parseWebhookEvent } from "@farcaster/frame-node";
import { ed25519 } from "@noble/curves/ed25519.js";
import { isHex } from "viem";
import { deleteUserNotificationDetails, setUserNotificationDetails } from "~~/utils/kv";
import { sendFrameNotification } from "~~/utils/notifs";

// import { decodeHeader, decodePayload, decodeSignature, fromBase64Url } from "~~/utils/jfs-utils"; // Will use these for full JFS verification

/**
 * Custom verification function for JSON Farcaster Signatures (JFS)
 * Based on the JFS specification: https://github.com/farcasterxyz/protocol/discussions/208
 *
 * This function is called by parseWebhookEvent with the parsed signature.
 * The signature parameter is the hex signature extracted from the JFS.
 */
async function verifyAppKey(fid: number, signature: string): Promise<any> {
  try {
    console.log("Verifying signature for FID:", fid, "Signature:", signature);

    // The signature parameter from parseWebhookEvent is just the hex signature
    // We need to get the full JFS from the request to verify it properly
    // For now, we'll implement a basic verification that checks if the signature is valid hex
    if (!isHex(signature)) {
      return { isValid: false, error: "Invalid signature format - not a valid hex string" };
    }

    // TODO: We need access to the full JFS (header, payload, signature) to properly verify
    // The parseWebhookEvent function is extracting just the signature component
    // We need to either:
    // 1. Parse the JFS manually before calling parseWebhookEvent, or
    // 2. Modify this function to work with the parsed data

    // For now, we'll do a basic validation
    if (signature.length !== 66) {
      // 0x + 64 hex chars
      return { isValid: false, error: "Invalid signature length" };
    }

    // TODO: Implement proper JFS verification once we have access to header and payload
    console.log("Basic signature validation passed for FID:", fid);
    return { isValid: true, error: null };
  } catch (error) {
    console.error("JFS verification error:", error);
    return { isValid: false, error: error instanceof Error ? error.message : "Unknown verification error" };
  }
}

export async function POST(request: NextRequest) {
  const requestJson = await request.json();

  let data;
  try {
    console.log("Raw webhook request:", JSON.stringify(requestJson, null, 2));
    data = await parseWebhookEvent(requestJson, verifyAppKey);
  } catch (e: unknown) {
    const error = e as ParseWebhookEvent.ErrorType;
    console.error("Webhook parsing error:", error);
    return Response.json({ success: false, error: "Invalid webhook data" }, { status: 400 });
  }

  const fid = data.fid;
  const event = data.event;

  switch (event.event) {
    case "frame_added":
      if (event.notificationDetails) {
        await setUserNotificationDetails(fid, event.notificationDetails);
        await sendFrameNotification({
          fid,
          title: "Welcome to Frames v2",
          body: "Frame is now added to your client",
        });
      } else {
        await deleteUserNotificationDetails(fid);
      }

      break;
    case "frame_removed":
      await deleteUserNotificationDetails(fid);

      break;
    case "notifications_enabled":
      await setUserNotificationDetails(fid, event.notificationDetails);
      await sendFrameNotification({
        fid,
        title: "Ding ding ding",
        body: "Notifications are now enabled",
      });

      break;
    case "notifications_disabled":
      await deleteUserNotificationDetails(fid);

      break;
  }

  return Response.json({ success: true });
}
