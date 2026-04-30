import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { session, user, verification } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Невалідні дані" } },
        { status: 400 }
      );
    }

    const { email, code, newPassword } = parsed.data;

    const [otpRecord] = await db
      .select()
      .from(verification)
      .where(
        and(
          eq(verification.identifier, email),
          eq(verification.value, code)
        )
      );

    if (!otpRecord) {
      return NextResponse.json(
        { error: { message: "Невірний код" } },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: { message: "Код прострочений" } },
        { status: 400 }
      );
    }

    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email));
    if (!foundUser) {
      return NextResponse.json(
        { error: { message: "Користувача не знайдено" } },
        { status: 400 }
      );
    }

    const ctx = await auth.$context;
    const hashedPassword = await ctx.password.hash(newPassword);
    await ctx.internalAdapter.updatePassword(foundUser.id, hashedPassword);

    await db
      .delete(verification)
      .where(eq(verification.id, otpRecord.id));

    await db.delete(session).where(eq(session.userId, foundUser.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/reset-password error:", err);
    return NextResponse.json(
      { error: { message: "Server error" } },
      { status: 500 }
    );
  }
}
