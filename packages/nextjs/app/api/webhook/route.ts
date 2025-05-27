import { NextResponse } from "next/server";
import { ParseWebhookEvent, parseWebhookEvent, verifyAppKeyWithNeynar } from "@farcaster/frame-node";
import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { sendNotification } from "~~/utils/notifications";
import { redis } from "~~/utils/redis";

const NOTIFICATION_KEY_PREFIX = "notifications:";

function getNotificationKey(fid: number): string {
  return `${NOTIFICATION_KEY_PREFIX}${fid}`;
}

type WebhookEvent = {
  event: "frame_added" | "frame_removed" | "notifications_enabled" | "notifications_disabled";
  notificationDetails?: FrameNotificationDetails;
};

export async function POST(request: Request) {
  try {
    const requestJson = await request.json();

    let data: { fid: number; event: WebhookEvent };
    try {
      data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
    } catch (e: unknown) {
      const error = e as ParseWebhookEvent.ErrorType;

      switch (error.name) {
        case "VerifyJsonFarcasterSignature.InvalidDataError":
        case "VerifyJsonFarcasterSignature.InvalidEventDataError":
          // The request data is invalid
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
          // The app key is invalid
          return NextResponse.json({ success: false, error: error.message }, { status: 401 });
        case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
          // Internal error verifying the app key
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    const fid = data.fid;
    const event = data.event;

    switch (event.event) {
      case "frame_added":
        if (event.notificationDetails) {
          await redis?.set(getNotificationKey(fid), event.notificationDetails);
          // Send welcome notification
          await sendNotification({
            fid,
            title: "Welcome!",
            body: "Thank you for adding our app",
          });
        }
        break;

      case "frame_removed":
        await redis?.del(getNotificationKey(fid));
        break;

      case "notifications_enabled":
        if (event.notificationDetails) {
          await redis?.set(getNotificationKey(fid), event.notificationDetails);
          // Send confirmation notification
          await sendNotification({
            fid,
            title: "Notifications Enabled",
            body: "You will now receive notifications from our app",
          });
        }
        break;

      case "notifications_disabled":
        await redis?.del(getNotificationKey(fid));
        break;

      default:
        console.warn(`Unknown event type: ${event.event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
