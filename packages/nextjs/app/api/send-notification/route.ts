import { NextRequest } from "next/server";
import { z } from "zod";
import { sendFrameNotification } from "~~/utils/notifs";

const requestSchema = z.object({
  fid: z.number(),
  title: z.string(),
  body: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json();
    const requestBody = requestSchema.safeParse(requestJson);

    if (requestBody.success === false) {
      return Response.json({ success: false, errors: requestBody.error.errors }, { status: 400 });
    }

    const { fid, title, body } = requestBody.data;

    // Send the notification
    const result = await sendFrameNotification({ fid, title, body });

    switch (result.state) {
      case "success":
        return Response.json({ success: true, message: "Notification sent successfully" });

      case "no_token":
        return Response.json(
          {
            success: false,
            error: "No notification token found for this user. User may not have enabled notifications.",
          },
          { status: 404 },
        );

      case "rate_limit":
        return Response.json(
          {
            success: false,
            error: "Rate limit exceeded. Please try again later.",
          },
          { status: 429 },
        );

      case "error":
        console.error("Notification sending error:", result.error);
        return Response.json(
          {
            success: false,
            error: "Failed to send notification",
          },
          { status: 500 },
        );

      default:
        return Response.json(
          {
            success: false,
            error: "Unknown error occurred",
          },
          { status: 500 },
        );
    }
  } catch (error) {
    console.error("Send notification API error:", error);
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
