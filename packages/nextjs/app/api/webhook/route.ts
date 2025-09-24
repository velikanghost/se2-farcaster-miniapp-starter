import { NextRequest } from "next/server";
import { ParseWebhookEvent, parseWebhookEvent } from "@farcaster/frame-node";
import { deleteUserNotificationDetails, setUserNotificationDetails } from "~~/utils/kv";
import { sendFrameNotification } from "~~/utils/notifs";

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
