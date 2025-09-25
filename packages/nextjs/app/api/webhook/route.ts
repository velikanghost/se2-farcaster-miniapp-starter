import { NextRequest } from "next/server";
// import { ParseWebhookEvent, parseWebhookEvent } from "@farcaster/frame-node"; // No longer needed - doing direct JFS verification
import { ed25519 } from "@noble/curves/ed25519.js";
import { hexToBytes } from "viem";
import { decodeHeader, decodePayload, decodeSignature } from "~~/utils/jfs-utils";
import { deleteUserNotificationDetails, setUserNotificationDetails } from "~~/utils/kv";
import { sendFrameNotification } from "~~/utils/notifs";

/**
 * Verify the full JFS from the webhook request
 */
async function verifyJFS(requestJson: any): Promise<{ isValid: boolean; error: string | null; data?: any }> {
  try {
    console.log("Raw webhook request:", JSON.stringify(requestJson, null, 2));

    // Check if we have the JFS components
    if (!requestJson.header || !requestJson.payload || !requestJson.signature) {
      return { isValid: false, error: "Missing JFS components" };
    }

    // Decode the header
    const header = decodeHeader(requestJson.header);
    console.log("Decoded header:", header);

    // Validate header structure
    if (!header.fid || !header.type || !header.key) {
      return { isValid: false, error: "Invalid JFS header" };
    }

    // Only support app_key type for now (most common for webhooks)
    if (header.type !== "app_key") {
      return { isValid: false, error: `Unsupported signature type: ${header.type}` };
    }

    // Decode the payload
    const payload = decodePayload(requestJson.payload);
    console.log("Decoded payload:", payload);

    // Construct the signing input as per JFS specification
    const signingInput = `${requestJson.header}.${requestJson.payload}`;

    // Decode the signature
    const signatureBytes = decodeSignature(requestJson.signature);
    console.log("Signature bytes length:", signatureBytes.length);

    // Verify the EdDSA signature for app_key type
    const verifyResult = ed25519.verify(
      signatureBytes,
      new Uint8Array(Buffer.from(signingInput, "utf-8")),
      hexToBytes(header.key),
    );

    if (!verifyResult) {
      return { isValid: false, error: "Invalid EdDSA signature" };
    }

    console.log("JFS verification successful for FID:", header.fid);
    return {
      isValid: true,
      error: null,
      data: {
        fid: header.fid,
        event: payload,
      },
    };
  } catch (error) {
    console.error("JFS verification error:", error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown verification error",
    };
  }
}

export async function POST(request: NextRequest) {
  const requestJson = await request.json();

  // Verify the JFS first
  const verification = await verifyJFS(requestJson);
  if (!verification.isValid) {
    console.error("JFS verification failed:", verification.error);
    return Response.json({ success: false, error: "Invalid webhook signature" }, { status: 400 });
  }

  const data = verification.data;

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
