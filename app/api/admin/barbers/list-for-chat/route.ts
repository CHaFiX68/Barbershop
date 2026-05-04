import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [me] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id));
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      userId: user.id,
      name: user.name,
      image: user.image,
      isActive: barberProfile.isActive,
    })
    .from(user)
    .leftJoin(barberProfile, eq(barberProfile.userId, user.id))
    .where(eq(user.role, "barber"))
    .orderBy(asc(user.name));

  return NextResponse.json({
    barbers: rows.map((r) => ({
      userId: r.userId,
      name: r.name,
      image: r.image ?? null,
      isActive: r.isActive ?? false,
    })),
  });
}
