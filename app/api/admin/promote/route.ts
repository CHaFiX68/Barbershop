import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [currentUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id));
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const [target] = await db
      .select()
      .from(user)
      .where(eq(user.email, parsed.data.email));
    if (!target) {
      return NextResponse.json(
        { error: "Немає юзера з таким email" },
        { status: 404 }
      );
    }
    if (target.role !== "user") {
      return NextResponse.json(
        { error: "Користувач уже барбер або адмін" },
        { status: 400 }
      );
    }

    await db
      .update(user)
      .set({ role: "barber", updatedAt: new Date() })
      .where(eq(user.id, target.id));

    const [existingProfile] = await db
      .select({ id: barberProfile.id })
      .from(barberProfile)
      .where(eq(barberProfile.userId, target.id));

    if (!existingProfile) {
      await db.insert(barberProfile).values({
        id: crypto.randomUUID(),
        userId: target.id,
        bio: null,
        landingImage: null,
        isActive: false,
      });
    }

    return NextResponse.json({
      ok: true,
      userId: target.id,
      name: target.name,
      email: target.email,
    });
  } catch (err) {
    console.error("POST /api/admin/promote error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
