import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
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

const submitSchema = z.object({
  bio: z.string().max(60).nullable(),
  landingImage: z.string().url().nullable(),
  isActive: z.boolean(),
  services: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        price: z.string().min(1).max(20),
      })
    )
    .max(6),
});

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[ANKETA-PUT] start, userId:", session.user.id);

    const [currentUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id));
    const role = currentUser?.role;
    console.log("[ANKETA-PUT] user role from DB:", role);
    if (!currentUser || (role !== "barber" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { bio, landingImage, isActive, services: incoming } = parsed.data;
    const userId = session.user.id;

    if (role === "admin") {
      console.log(
        "[ANKETA-PUT] taking ADMIN branch (writing to barber_profile + service)"
      );
      await db
        .insert(barberProfile)
        .values({
          id: crypto.randomUUID(),
          userId,
          bio,
          landingImage,
          isActive,
        })
        .onConflictDoUpdate({
          target: barberProfile.userId,
          set: {
            bio,
            landingImage,
            isActive,
            updatedAt: new Date(),
          },
        });

      await db.delete(service).where(eq(service.barberUserId, userId));

      if (incoming.length > 0) {
        await db.insert(service).values(
          incoming.map((s, idx) => ({
            id: crypto.randomUUID(),
            barberUserId: userId,
            name: s.name,
            price: s.price,
            orderIndex: idx,
          }))
        );
      }

      console.log("[ANKETA-PUT] returning status:", "approved");
      return NextResponse.json({ ok: true, status: "approved" });
    }

    console.log(
      "[ANKETA-PUT] taking BARBER branch (writing to barber_profile_pending + service_pending)"
    );
    await db
      .insert(barberProfilePending)
      .values({
        id: crypto.randomUUID(),
        userId,
        bio,
        landingImage,
        isActive,
      })
      .onConflictDoUpdate({
        target: barberProfilePending.userId,
        set: {
          bio,
          landingImage,
          isActive,
          submittedAt: new Date(),
        },
      });

    await db
      .delete(servicePending)
      .where(eq(servicePending.barberUserId, userId));

    if (incoming.length > 0) {
      await db.insert(servicePending).values(
        incoming.map((s, idx) => ({
          id: crypto.randomUUID(),
          barberUserId: userId,
          name: s.name,
          price: s.price,
          orderIndex: idx,
        }))
      );
    }

    console.log("[ANKETA-PUT] returning status:", "pending");
    return NextResponse.json({ ok: true, status: "pending" });
  } catch (err) {
    console.error("PUT /api/barber/anketa error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
