import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { verifyMessage } from "viem";
import { fetchUser } from "~~/utils/neynar";

export const POST = async (req: NextRequest) => {
  const { fid, signature, message } = await req.json();
  const user = await fetchUser(fid);

  // Verify signature matches custody address
  const isValidSignature = await verifyMessage({
    address: user.custody_address as `0x${string}`,
    message,
    signature,
  });

  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Generate JWT token
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new jose.SignJWT({
    fid,
    walletAddress: user.custody_address,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  // Create the response
  const response = NextResponse.json({ success: true, user });

  // Set the auth cookie with the JWT token
  response.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return response;
};
