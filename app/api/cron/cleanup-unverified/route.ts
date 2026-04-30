import { NextResponse } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, verification } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = new Date(Date.now() - 10 * 60 * 1000);

    const deletedUsers = await db
      .delete(user)
      .where(and(eq(user.emailVerified, false), lt(user.createdAt, cutoff)))
      .returning({ id: user.id, email: user.email });

    const deletedVerifications = await db
      .delete(verification)
      .where(lt(verification.expiresAt, new Date()))
      .returning({ id: verification.id });

    console.log(
      `[cron-cleanup] deleted ${deletedUsers.length} unverified users, ${deletedVerifications.length} expired verifications`
    );

    return NextResponse.json({
      ok: true,
      deletedUsers: deletedUsers.length,
      deletedVerifications: deletedVerifications.length,
    });
  } catch (err) {
    console.error("GET /api/cron/cleanup-unverified error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
