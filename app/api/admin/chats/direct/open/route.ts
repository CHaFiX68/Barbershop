import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  barberUserId: z.string().min(1),
});

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

  const adminId = session.user.id;

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { barberUserId } = parsed.data;

  if (barberUserId === adminId) {
    return NextResponse.json(
      { error: "Не можна відкрити чат сам із собою" },
      { status: 400 }
    );
  }

  const [target] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.id, barberUserId));
  if (!target || target.role !== "barber") {
    return NextResponse.json(
      { error: "Барбер не знайдений" },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({ id: chat.id, status: chat.status })
    .from(chat)
    .where(
      and(
        eq(chat.type, "direct_admin"),
        eq(chat.status, "active"),
        eq(chat.participantAUserId, adminId),
        eq(chat.participantBUserId, barberUserId)
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
    participantBUserId: barberUserId,
  });

  return NextResponse.json({ chatId: id });
}
