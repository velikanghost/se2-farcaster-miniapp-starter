import { NextRequest } from "next/server";
import { ParseWebhookEvent, parseWebhookEvent } from "@farcaster/frame-node";
import { verifyMessage } from "viem";
import { isHex } from "viem";
import { deleteUserNotificationDetails, setUserNotificationDetails } from "~~/utils/kv";
import { sendFrameNotification } from "~~/utils/notifs";

/**
 * Custom verification function for JSON Farcaster Signatures (JFS)
 * Based on the JFS specification: https://github.com/farcasterxyz/protocol/discussions/208
 */
async function verifyAppKey(fid: number, signature: string): Promise<void> {
  try {
    // Parse the JFS from the signature
    const jfsParts = signature.split(".");
    if (jfsParts.length !== 3) {
      throw new Error("Invalid JFS format");
    }

    const [encodedHeader, encodedPayload, encodedSignature] = jfsParts;

    // Decode the header
    const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf-8"));

    // Validate header structure
    if (!header.fid || !header.type || !header.key) {
      throw new Error("Invalid JFS header");
    }

    // Verify that the FID in the signature matches the expected FID
    if (header.fid !== fid) {
      throw new Error(`FID mismatch: expected ${fid}, got ${header.fid}`);
    }

    // Only support app_key type for now (most common for webhooks)
    if (header.type !== "app_key") {
      throw new Error(`Unsupported signature type: ${header.type}`);
    }

    // Construct the signing input as per JFS specification
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    // Verify the signature
    // For app_key type, this should be an EdDSA signature
    // We'll use viem's verifyMessage which handles ECDSA signatures
    // Note: This is a simplified implementation - in production you might need
    // to handle EdDSA signatures differently depending on the key type
    const isValid = await verifyMessage({
      address: header.key as `0x${string}`,
      message: signingInput,
      signature: encodedSignature as `0x${string}`,
    });

    if (!isValid) {
      // Try legacy encoding fallback as mentioned in the JFS spec
      try {
        const utf8EncodedHexSignature = Buffer.from(encodedSignature).toString("utf-8");
        if (isHex(utf8EncodedHexSignature)) {
          const fallbackResult = await verifyMessage({
            address: header.key as `0x${string}`,
            message: signingInput,
            signature: utf8EncodedHexSignature as `0x${string}`,
          });
          if (fallbackResult) {
            return; // Success
          }
        }
      } catch (fallbackError) {
        // Fallback failed, original signature is invalid
      }
    }

    if (!isValid) {
      throw new Error("Invalid signature");
    }
  } catch (error) {
    console.error("JFS verification error:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const requestJson = await request.json();

  let data;
  try {
    //mock verifyAppKey
    //TODO
    const verifyAppKey = () => {
      return {
        isValid: true,
        error: null,
      };
    };
    data = await parseWebhookEvent(requestJson, verifyAppKey as any);
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
