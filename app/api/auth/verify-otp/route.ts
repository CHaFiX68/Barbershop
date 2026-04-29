import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { verifyOtp } from "@/lib/otp";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown; code?: unknown };
    const { email, code } = body;
    if (
      !email ||
      typeof email !== "string" ||
      !code ||
      typeof code !== "string"
    ) {
      return NextResponse.json(
        { error: "Email and code required" },
        { status: 400 }
      );
    }
    const result = await verifyOtp(email, code);
    if (!result.valid) {
      return NextResponse.json(
        {
          error:
            result.reason === "expired" ? "Код прострочений" : "Невірний код",
        },
        { status: 400 }
      );
    }
    await db
      .update(user)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(user.email, email));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
