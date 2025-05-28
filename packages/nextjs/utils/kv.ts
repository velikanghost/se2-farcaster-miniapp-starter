import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";

if (!process.env.NEXT_PUBLIC_KV_REST_API_URL || !process.env.NEXT_PUBLIC_KV_REST_API_TOKEN) {
  console.warn(
    "KV_REST_API_URL or KV_REST_API_TOKEN environment variable is not defined, please add to enable background notifications and webhooks.",
  );
}

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_KV_REST_API_URL || "",
  token: process.env.NEXT_PUBLIC_KV_REST_API_TOKEN || "",
});

function getUserNotificationDetailsKey(fid: number): string {
  return `frames-v2-demo:user:${fid}`;
}

export async function getUserNotificationDetails(fid: number): Promise<FrameNotificationDetails | null> {
  return await redis.get<FrameNotificationDetails>(getUserNotificationDetailsKey(fid));
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails,
): Promise<void> {
  await redis.set(getUserNotificationDetailsKey(fid), notificationDetails);
}

export async function deleteUserNotificationDetails(fid: number): Promise<void> {
  await redis.del(getUserNotificationDetailsKey(fid));
}
