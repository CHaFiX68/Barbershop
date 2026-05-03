import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  barberProfile,
  barberProfilePending,
  service,
  servicePending,
  user,
} from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({ userId: z.string().min(1) });

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
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const targetUserId = parsed.data.userId;

    const [pendingProfile] = await db
      .select()
      .from(barberProfilePending)
      .where(eq(barberProfilePending.userId, targetUserId));
    if (!pendingProfile) {
      return NextResponse.json(
        { error: "Немає pending анкети" },
        { status: 404 }
      );
    }

    if (!(pendingProfile.phone ?? "").trim()) {
      return NextResponse.json(
        { error: "Не можна затвердити анкету без телефону" },
        { status: 400 }
      );
    }

    const pendingServices = await db
      .select()
      .from(servicePending)
      .where(eq(servicePending.barberUserId, targetUserId))
      .orderBy(asc(servicePending.orderIndex));

    await db
      .insert(barberProfile)
      .values({
        id: crypto.randomUUID(),
        userId: targetUserId,
        phone: pendingProfile.phone,
        bio: pendingProfile.bio,
        landingImage: pendingProfile.landingImage,
        isActive: pendingProfile.isActive,
        schedule: pendingProfile.schedule,
      })
      .onConflictDoUpdate({
        target: barberProfile.userId,
        set: {
          phone: pendingProfile.phone,
          bio: pendingProfile.bio,
          landingImage: pendingProfile.landingImage,
          isActive: pendingProfile.isActive,
          schedule: pendingProfile.schedule,
          updatedAt: new Date(),
        },
      });

    await db.delete(service).where(eq(service.barberUserId, targetUserId));

    if (pendingServices.length > 0) {
      await db.insert(service).values(
        pendingServices.map((s, idx) => ({
          id: crypto.randomUUID(),
          barberUserId: targetUserId,
          name: s.name,
          price: s.price,
          estimatedMinutes: s.estimatedMinutes ?? null,
          orderIndex: idx,
        }))
      );
    }

    await db
      .delete(barberProfilePending)
      .where(eq(barberProfilePending.userId, targetUserId));
    await db
      .delete(servicePending)
      .where(eq(servicePending.barberUserId, targetUserId));

    revalidatePath("/");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/anketa/approve error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
