import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => null)) as
    | { barberId?: unknown }
    | null;
  if (!body || typeof body.barberId !== "string" || !body.barberId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const adminId = session.user.id;
  const barberId = body.barberId;

  if (barberId === adminId) {
    return NextResponse.json(
      { error: "Cannot open chat with self" },
      { status: 400 }
    );
  }

  const [barber] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.id, barberId));
  if (!barber || barber.role !== "barber") {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  const [existing] = await db
    .select({ id: chat.id })
    .from(chat)
    .where(
      and(
        eq(chat.type, "direct_admin"),
        eq(chat.status, "active"),
        or(
          and(
            eq(chat.participantAUserId, adminId),
            eq(chat.participantBUserId, barberId)
          ),
          and(
            eq(chat.participantAUserId, barberId),
            eq(chat.participantBUserId, adminId)
          )
        )
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({ chatId: existing.id });
  }

  const id = crypto.randomUUID();
  await db.insert(chat).values({
    id,
    type: "direct_admin",
    status: "active",
    participantAUserId: adminId,
    participantBUserId: barberId,
  });

  return NextResponse.json({ chatId: id });
}
