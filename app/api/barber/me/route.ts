import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";
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

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[ME-GET] start, userId:", session.user.id);

    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id));
    const role = currentUser?.role;
    console.log("[ME-GET] role from DB:", role);
    if (!currentUser || (role !== "barber" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (role === "barber") {
      console.log("[ME-GET] checking pending table...");
      const [pendingProfile] = await db
        .select()
        .from(barberProfilePending)
        .where(eq(barberProfilePending.userId, session.user.id));
      console.log("[ME-GET] pending profile result:", pendingProfile);

      if (pendingProfile) {
        console.log("[ME-GET] returning PENDING data");
        const pendingServices = await db
          .select()
          .from(servicePending)
          .where(eq(servicePending.barberUserId, session.user.id))
          .orderBy(asc(servicePending.orderIndex));

        return NextResponse.json({
          userName: currentUser.name,
          initials: computeInitials(currentUser.name),
          profile: {
            bio: pendingProfile.bio ?? "",
            landingImage: pendingProfile.landingImage,
            isActive: pendingProfile.isActive,
            schedule: normalizeWeekSchedule(pendingProfile.schedule),
          },
          services: pendingServices.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price,
          })),
          hasPendingChanges: true,
        });
      }
    }

    console.log("[ME-GET] returning APPROVED data");
    const [profile] = await db
      .select()
      .from(barberProfile)
      .where(eq(barberProfile.userId, session.user.id));

    if (!profile) {
      if (role === "barber") {
        console.log(
          "[ME-GET] no profile found for barber, auto-creating empty pending"
        );
        const newId = crypto.randomUUID();
        try {
          await db.insert(barberProfilePending).values({
            id: newId,
            userId: session.user.id,
            bio: null,
            landingImage: null,
            isActive: false,
            schedule: null,
          });
          console.log("[ME-GET] auto-created profile id=", newId);
        } catch (err) {
          console.log(
            "[ME-GET] auto-create insert failed (likely race), will re-select:",
            err
          );
        }
        const [refetched] = await db
          .select()
          .from(barberProfilePending)
          .where(eq(barberProfilePending.userId, session.user.id));
        if (!refetched) {
          return NextResponse.json(
            { error: "Profile not found" },
            { status: 404 }
          );
        }
        console.log("[ME-GET] returning AUTO-CREATED data");
        return NextResponse.json({
          userName: currentUser.name,
          initials: computeInitials(currentUser.name),
          profile: {
            bio: refetched.bio ?? "",
            landingImage: refetched.landingImage,
            isActive: refetched.isActive,
            schedule: normalizeWeekSchedule(refetched.schedule),
          },
          services: [],
          hasPendingChanges: false,
        });
      }

      console.log(
        "[ME-GET] no profile found for admin, auto-creating empty approved"
      );
      const newId = crypto.randomUUID();
      try {
        await db.insert(barberProfile).values({
          id: newId,
          userId: session.user.id,
          bio: null,
          landingImage: null,
          isActive: false,
          schedule: null,
        });
        console.log("[ME-GET] auto-created profile id=", newId);
      } catch (err) {
        console.log(
          "[ME-GET] auto-create insert failed (likely race), will re-select:",
          err
        );
      }
      const [refetched] = await db
        .select()
        .from(barberProfile)
        .where(eq(barberProfile.userId, session.user.id));
      if (!refetched) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
      console.log("[ME-GET] returning AUTO-CREATED data");
      return NextResponse.json({
        userName: currentUser.name,
        initials: computeInitials(currentUser.name),
        profile: {
          bio: refetched.bio ?? "",
          landingImage: refetched.landingImage,
          isActive: refetched.isActive,
          schedule: normalizeWeekSchedule(refetched.schedule),
        },
        services: [],
        hasPendingChanges: false,
      });
    }

    const services = await db
      .select()
      .from(service)
      .where(eq(service.barberUserId, session.user.id))
      .orderBy(asc(service.orderIndex));

    return NextResponse.json({
      userName: currentUser.name,
      initials: computeInitials(currentUser.name),
      profile: {
        bio: profile.bio ?? "",
        landingImage: profile.landingImage,
        isActive: profile.isActive,
        schedule: normalizeWeekSchedule(profile.schedule),
      },
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
      })),
      hasPendingChanges: false,
    });
  } catch (err) {
    console.error("GET /api/barber/me error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
