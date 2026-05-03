import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  barberProfile,
  barberProfilePending,
  service,
  servicePending,
  user,
} from "@/lib/db/schema";
import { normalizeWeekSchedule } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const rows = await db
      .select({
        userId: user.id,
        name: user.name,
        email: user.email,
        avatar: user.image,
        approvedPhone: barberProfile.phone,
        approvedBio: barberProfile.bio,
        approvedLandingImage: barberProfile.landingImage,
        approvedIsActive: barberProfile.isActive,
        approvedSchedule: barberProfile.schedule,
        pendingPhone: barberProfilePending.phone,
        pendingBio: barberProfilePending.bio,
        pendingLandingImage: barberProfilePending.landingImage,
        pendingSchedule: barberProfilePending.schedule,
        createdAt: user.createdAt,
        pendingId: barberProfilePending.id,
      })
      .from(user)
      .leftJoin(barberProfile, eq(barberProfile.userId, user.id))
      .leftJoin(
        barberProfilePending,
        eq(barberProfilePending.userId, user.id)
      )
      .where(eq(user.role, "barber"))
      .orderBy(desc(user.createdAt));

    const userIds = rows.map((r) => r.userId);

    let approvedSvcByUser = new Map<string, { name: string; price: string }[]>();
    let pendingSvcByUser = new Map<string, { name: string; price: string }[]>();
    if (userIds.length > 0) {
      const [approvedSvcRows, pendingSvcRows] = await Promise.all([
        db
          .select({
            userId: service.barberUserId,
            name: service.name,
            price: service.price,
            orderIndex: service.orderIndex,
          })
          .from(service)
          .where(inArray(service.barberUserId, userIds))
          .orderBy(asc(service.orderIndex)),
        db
          .select({
            userId: servicePending.barberUserId,
            name: servicePending.name,
            price: servicePending.price,
            orderIndex: servicePending.orderIndex,
          })
          .from(servicePending)
          .where(inArray(servicePending.barberUserId, userIds))
          .orderBy(asc(servicePending.orderIndex)),
      ]);

      approvedSvcByUser = approvedSvcRows.reduce((acc, s) => {
        const list = acc.get(s.userId) ?? [];
        list.push({ name: s.name, price: s.price });
        acc.set(s.userId, list);
        return acc;
      }, new Map<string, { name: string; price: string }[]>());

      pendingSvcByUser = pendingSvcRows.reduce((acc, s) => {
        const list = acc.get(s.userId) ?? [];
        list.push({ name: s.name, price: s.price });
        acc.set(s.userId, list);
        return acc;
      }, new Map<string, { name: string; price: string }[]>());
    }

    return NextResponse.json({
      barbers: rows.map((r) => {
        const hasPending = r.pendingId !== null;
        const services = hasPending
          ? pendingSvcByUser.get(r.userId) ?? []
          : approvedSvcByUser.get(r.userId) ?? [];
        const rawSchedule = hasPending ? r.pendingSchedule : r.approvedSchedule;
        return {
          userId: r.userId,
          name: r.name,
          email: r.email,
          avatar: r.avatar,
          approvedPhone: r.approvedPhone ?? null,
          pendingPhone: r.pendingPhone ?? null,
          phone: hasPending
            ? r.pendingPhone ?? r.approvedPhone ?? null
            : r.approvedPhone ?? null,
          bio: hasPending
            ? r.pendingBio ?? r.approvedBio ?? null
            : r.approvedBio ?? null,
          landingImage: hasPending
            ? r.pendingLandingImage ?? r.approvedLandingImage ?? null
            : r.approvedLandingImage ?? null,
          isActive: r.approvedIsActive ?? false,
          hasPending,
          schedule: normalizeWeekSchedule(rawSchedule),
          services,
          createdAt: r.createdAt.toISOString(),
        };
      }),
    });
  } catch (err) {
    console.error("GET /api/admin/barbers error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
