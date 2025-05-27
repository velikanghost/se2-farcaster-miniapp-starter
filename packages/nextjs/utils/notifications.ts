import { redis } from "./redis";
import type { FrameNotificationDetails } from "@farcaster/frame-sdk";

const NOTIFICATION_KEY_PREFIX = "notifications:";

function getNotificationKey(fid: number): string {
  return `${NOTIFICATION_KEY_PREFIX}${fid}`;
}

export async function getUserNotificationDetails(fid: number): Promise<FrameNotificationDetails | null> {
  if (!redis) return null;
  return await redis.get<FrameNotificationDetails>(getNotificationKey(fid));
}

interface SendNotificationParams {
  fid: number;
  title: string;
  body: string;
  targetUrl?: string;
  notificationId?: string;
}

interface NotificationResponse {
  successfulTokens: string[];
  invalidTokens: string[];
  rateLimitedTokens: string[];
}

export async function sendNotification({
  fid,
  title,
  body,
  targetUrl,
  notificationId = crypto.randomUUID(),
}: SendNotificationParams): Promise<NotificationResponse | null> {
  if (!redis) return null;

  const notificationDetails = await getUserNotificationDetails(fid);

  if (!notificationDetails) {
    console.log(`No notification details found for FID: ${fid}`);
    return null;
  }

  const { url, token } = notificationDetails;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId,
        title,
        body,
        targetUrl: targetUrl || process.env.NEXT_PUBLIC_URL,
        tokens: [token],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    const result = await response.json();

    // If the token is invalid, remove it from Redis
    if (result.invalidTokens?.includes(token)) {
      await redis.del(getNotificationKey(fid));
    }

    return result;
  } catch (error) {
    console.error("Error sending notification:", error);
    return null;
  }
}
