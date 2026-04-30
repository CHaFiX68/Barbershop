import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { generateOtp, saveOtp } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Невалідний email" } },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (!foundUser) {
      return NextResponse.json({ ok: true });
    }

    if (!foundUser.emailVerified) {
      return NextResponse.json(
        { error: { message: "Спочатку підтвердіть email" } },
        { status: 400 }
      );
    }

    const code = generateOtp();
    await saveOtp(email, code);
    await sendVerificationEmail(email, code);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/forgot-password error:", err);
    return NextResponse.json(
      { error: { message: "Server error" } },
      { status: 500 }
    );
  }
}
