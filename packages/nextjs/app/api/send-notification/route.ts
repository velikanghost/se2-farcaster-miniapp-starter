import { NextRequest } from "next/server";
import { notificationDetailsSchema } from "@farcaster/frame-core";
import { SendNotificationRequest, sendNotificationResponseSchema } from "@farcaster/frame-sdk";
import { z } from "zod";
import { setUserNotificationDetails } from "~~/utils/kv";
import { sendFrameNotification } from "~~/utils/notifs";

const requestSchema = z.object({
  token: z.string(),
  url: z.string(),
  targetUrl: z.string(),
  fid: z.number().optional(),
});

export async function POST(request: NextRequest) {
  const requestJson = await request.json();
  const requestBody = requestSchema.safeParse(requestJson);

  if (requestBody.success === false) {
    return Response.json({ success: false, errors: requestBody.error.errors }, { status: 400 });
  }

  const notificationDetails = {
    token: requestBody.data.token,
    url: requestBody.data.url,
  };

  // Store notification details in KV store
  await setUserNotificationDetails(requestBody.data.fid || 0, notificationDetails);

  const response = await fetch(requestBody.data.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notificationId: crypto.randomUUID(),
      title: "Hello from Frames v2!",
      body: "This is a test notification",
      targetUrl: requestBody.data.targetUrl,
      tokens: [requestBody.data.token],
    } satisfies SendNotificationRequest),
  });

  const responseJson = await response.json();

  if (response.status === 200) {
    // Ensure correct response
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (responseBody.success === false) {
      return Response.json({ success: false, errors: responseBody.error.errors }, { status: 500 });
    }

    // Fail when rate limited
    if (responseBody.data.result.rateLimitedTokens.length) {
      return Response.json({ success: false, error: "Rate limited" }, { status: 429 });
    }

    return Response.json({ success: true });
  } else {
    return Response.json({ success: false, error: responseJson }, { status: 500 });
  }
}

// import { NextRequest } from "next/server";
// import { notificationDetailsSchema } from "@farcaster/frame-core";
// import { z } from "zod";
// import { setUserNotificationDetails } from "~~/utils/kv";
// import { sendFrameNotification } from "~~/utils/notifs";

// const requestSchema = z.object({
//   fid: z.number(),
//   notificationDetails: notificationDetailsSchema,
// });

// export async function POST(request: NextRequest) {
//   const requestJson = await request.json();
//   const requestBody = requestSchema.safeParse(requestJson);

//   if (requestBody.success === false) {
//     return Response.json({ success: false, errors: requestBody.error.errors }, { status: 400 });
//   }

//   await setUserNotificationDetails(requestBody.data.fid, requestBody.data.notificationDetails);

//   const sendResult = await sendFrameNotification({
//     fid: requestBody.data.fid,
//     title: "Test notification",
//     body: "Sent at " + new Date().toISOString(),
//   });

//   if (sendResult.state === "error") {
//     return Response.json({ success: false, error: sendResult.error }, { status: 500 });
//   } else if (sendResult.state === "rate_limit") {
//     return Response.json({ success: false, error: "Rate limited" }, { status: 429 });
//   }

//   return Response.json({ success: true });
// }
