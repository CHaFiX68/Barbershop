import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, verification } from "@/lib/db/schema";
import { generateOtp, saveOtp } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid input" } },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, email));
    const existingUser = existing[0];

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { error: { message: "User with this email already exists" } },
          { status: 409 }
        );
      }
      await db.delete(user).where(eq(user.id, existingUser.id));
      await db
        .delete(verification)
        .where(eq(verification.identifier, email));
    }

    const reqHeaders = await headers();
    try {
      await auth.api.signUpEmail({
        body: { name, email, password },
        headers: reqHeaders,
      });
    } catch (err) {
      const message = (err as Error)?.message ?? "Sign-up failed";
      return NextResponse.json(
        { error: { message } },
        { status: 400 }
      );
    }

    try {
      const code = generateOtp();
      await saveOtp(email, code);
      await sendVerificationEmail(email, code);
    } catch (err) {
      console.error("send-otp during register error:", err);
      return NextResponse.json(
        {
          error: {
            message:
              "Акаунт створено, але не вдалось надіслати код. Спробуй ще раз",
          },
          partialSuccess: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    return NextResponse.json(
      { error: { message: "Server error" } },
      { status: 500 }
    );
  }
}
