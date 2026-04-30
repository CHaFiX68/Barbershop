import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, barberProfilePending, user } from "@/lib/db/schema";

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
        bio: barberProfile.bio,
        landingImage: barberProfile.landingImage,
        isActive: barberProfile.isActive,
        createdAt: user.createdAt,
        pendingId: barberProfilePending.id,
      })
      .from(user)
      .innerJoin(barberProfile, eq(barberProfile.userId, user.id))
      .leftJoin(
        barberProfilePending,
        eq(barberProfilePending.userId, user.id)
      )
      .where(eq(user.role, "barber"))
      .orderBy(desc(user.createdAt));

    return NextResponse.json({
      barbers: rows.map((r) => ({
        userId: r.userId,
        name: r.name,
        email: r.email,
        avatar: r.avatar,
        bio: r.bio,
        landingImage: r.landingImage,
        isActive: r.isActive,
        hasPending: r.pendingId !== null,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("GET /api/admin/barbers error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
