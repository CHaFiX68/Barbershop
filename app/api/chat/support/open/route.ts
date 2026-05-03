import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat } from "@/lib/db/schema";
import { getPrimaryAdminUserId } from "@/lib/db/admins";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  // Look up only ACTIVE support chat. If user has only archived ones, we
  // create a fresh one — admin treats archived as "ticket closed".
  const [existing] = await db
    .select({ id: chat.id })
    .from(chat)
    .where(
      and(
        eq(chat.type, "support"),
        eq(chat.status, "active"),
        or(
          eq(chat.participantAUserId, me),
          eq(chat.participantBUserId, me)
        )
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({ chatId: existing.id });
  }

  const adminId = await getPrimaryAdminUserId();
  if (!adminId) {
    return NextResponse.json(
      { error: "Підтримка тимчасово недоступна" },
      { status: 503 }
    );
  }

  // Edge case: current user is the admin themselves. Don't create
  // a self-chat — return 400 with a clear message.
  if (adminId === me) {
    return NextResponse.json(
      { error: "Адміністратор не може відкрити чат підтримки сам із собою" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  await db.insert(chat).values({
    id,
    type: "support",
    status: "active",
    participantAUserId: me,
    participantBUserId: adminId,
  });

  return NextResponse.json({ chatId: id });
}
