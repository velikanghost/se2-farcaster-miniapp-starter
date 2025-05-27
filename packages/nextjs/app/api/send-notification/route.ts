import { NextRequest } from "next/server";
import { z } from "zod";
import { setUserNotificationDetails } from "~~/utils/kv";

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

  return Response.json({ success: true });
}
