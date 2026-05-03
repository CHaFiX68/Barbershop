import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, service, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  const [row] = await db
    .select({
      userId: user.id,
      name: user.name,
      bio: barberProfile.bio,
      landingImage: barberProfile.landingImage,
      isActive: barberProfile.isActive,
      role: user.role,
    })
    .from(user)
    .innerJoin(barberProfile, eq(barberProfile.userId, user.id))
    .where(eq(user.id, userId));

  if (!row || row.role !== "barber" || !row.isActive) {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  const services = await db
    .select({
      id: service.id,
      name: service.name,
      price: service.price,
      estimatedMinutes: service.estimatedMinutes,
    })
    .from(service)
    .where(eq(service.barberUserId, userId))
    .orderBy(asc(service.orderIndex));

  return NextResponse.json({
    barber: {
      userId: row.userId,
      name: row.name,
      bio: row.bio,
      landingImage: row.landingImage,
    },
    services,
  });
}
