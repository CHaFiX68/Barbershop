import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfilePending, servicePending, user } from "@/lib/db/schema";

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

    await db
      .delete(barberProfilePending)
      .where(eq(barberProfilePending.userId, targetUserId));
    await db
      .delete(servicePending)
      .where(eq(servicePending.barberUserId, targetUserId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/anketa/reject error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
