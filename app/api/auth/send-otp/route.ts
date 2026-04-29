import { NextResponse } from "next/server";
import { generateOtp, saveOtp } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = body.email;
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const code = generateOtp();
    await saveOtp(email, code);
    await sendVerificationEmail(email, code);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
