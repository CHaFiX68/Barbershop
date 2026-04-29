import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

const updateNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ім'я має містити щонайменше 2 символи")
    .max(50, "Ім'я задовге"),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = updateNameSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await db
      .update(user)
      .set({ name: result.data.name, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ ok: true, name: result.data.name });
  } catch (err) {
    console.error("PATCH /api/user/me error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
