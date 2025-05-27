import { NextResponse } from "next/server";
// import { parseWebhookEvent } from "@farcaster/frame-node";
// import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { redis } from "~~/utils/redis";

const NOTIFICATION_KEY_PREFIX = "notifications:";

function getNotificationKey(fid: number): string {
  return `${NOTIFICATION_KEY_PREFIX}${fid}`;
}

export async function POST(request: Request) {
  try {
    const requestJson = await request.json();

    // Parse and verify the webhook event
    const { fid, event, notificationDetails } = requestJson;

    switch (event) {
      case "frame_added":
        if (notificationDetails) {
          await redis?.set(getNotificationKey(fid), notificationDetails);
        }
        break;

      case "frame_removed":
        await redis?.del(getNotificationKey(fid));
        break;

      case "notifications_enabled":
        if (notificationDetails) {
          await redis?.set(getNotificationKey(fid), notificationDetails);
        }
        break;

      case "notifications_disabled":
        await redis?.del(getNotificationKey(fid));
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
