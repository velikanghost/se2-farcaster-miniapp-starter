import { NextResponse } from "next/server";
import { sendNotification } from "~~/utils/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fid, notification } = body;

    if (!fid || !notification) {
      return NextResponse.json({ error: "Missing required fields: fid and notification" }, { status: 400 });
    }

    const result = await sendNotification({
      fid,
      title: notification.title,
      body: notification.body,
      targetUrl: notification.targetUrl,
      notificationId: notification.notificationId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Return the full response from the notification service
    return NextResponse.json({
      success: true,
      ...result.response,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
