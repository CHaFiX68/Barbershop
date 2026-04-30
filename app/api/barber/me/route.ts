import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, service, user } from "@/lib/db/schema";

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

    const [profile] = await db
      .select()
      .from(barberProfile)
      .where(eq(barberProfile.userId, session.user.id));
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
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
      },
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
      })),
    });
  } catch (err) {
    console.error("GET /api/barber/me error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
