import { redis } from "./redis";
import type { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { z } from "zod";

const NOTIFICATION_KEY_PREFIX = "notifications:";

// Notification schemas as per Farcaster docs
export const sendNotificationRequestSchema = z.object({
  notificationId: z.string().max(128),
  title: z.string().max(32),
  body: z.string().max(128),
  targetUrl: z.string().max(256),
  tokens: z.array(z.string()).max(100),
});

export const sendNotificationResponseSchema = z.object({
  result: z.object({
    successfulTokens: z.array(z.string()),
    invalidTokens: z.array(z.string()),
    rateLimitedTokens: z.array(z.string()),
  }),
});

export type SendNotificationRequest = z.infer<typeof sendNotificationRequestSchema>;
export type SendNotificationResponse = z.infer<typeof sendNotificationResponseSchema>;

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

type SendNotificationResult = { success: true; response: SendNotificationResponse } | { success: false; error: string };

export async function sendNotification({
  fid,
  title,
  body,
  targetUrl,
  notificationId = crypto.randomUUID(),
}: SendNotificationParams): Promise<SendNotificationResult> {
  if (!redis) return { success: false, error: "Redis not available" };

  const notificationDetails = await getUserNotificationDetails(fid);

  if (!notificationDetails) {
    console.log(`No notification details found for FID: ${fid}`);
    return { success: false, error: "No notification details found" };
  }

  const { url, token } = notificationDetails;

  // Validate request against schema
  const requestValidation = sendNotificationRequestSchema.safeParse({
    notificationId,
    title,
    body,
    targetUrl: targetUrl || process.env.NEXT_PUBLIC_URL,
    tokens: [token],
  });

  if (!requestValidation.success) {
    return { success: false, error: requestValidation.error.message };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestValidation.data),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    const responseData = await response.json();
    const responseValidation = sendNotificationResponseSchema.safeParse(responseData);

    if (!responseValidation.success) {
      return { success: false, error: "Invalid response format from notification server" };
    }

    // Handle invalid tokens
    if (responseValidation.data.result.invalidTokens.includes(token)) {
      await redis.del(getNotificationKey(fid));
    }

    return { success: true, response: responseValidation.data };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
