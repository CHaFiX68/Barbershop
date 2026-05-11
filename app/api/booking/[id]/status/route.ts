import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["complete", "no_show"]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const [b] = await db
      .select()
      .from(booking)
      .where(eq(booking.id, id));

    if (!b) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (b.barberUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (b.status !== "active") {
      return NextResponse.json(
        { error: "Booking is not pending" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (new Date(b.endsAt) > now) {
      return NextResponse.json(
        { error: "Booking time has not finished yet" },
        { status: 400 }
      );
    }

    const newStatus =
      parsed.data.action === "complete" ? "completed" : "no_show";

    await db
      .update(booking)
      .set({ status: newStatus })
      .where(eq(booking.id, id));

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err) {
    console.error("[booking/status] error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
