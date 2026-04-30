import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, user } from "@/lib/db/schema";

const updateSchema = z.object({
  bio: z.string().trim().max(60, "Біо макс 60 символів").optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id));
    if (
      !currentUser ||
      (currentUser.role !== "barber" && currentUser.role !== "admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (result.data.bio !== undefined) updateData.bio = result.data.bio;
    if (result.data.isActive !== undefined)
      updateData.isActive = result.data.isActive;

    await db
      .update(barberProfile)
      .set(updateData)
      .where(eq(barberProfile.userId, session.user.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/barber/profile error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
