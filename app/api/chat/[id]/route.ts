import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, chat } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = session.user.id;
  const { id: chatId } = await params;

  const [chatRow] = await db
    .select({
      id: chat.id,
      type: chat.type,
      participantAUserId: chat.participantAUserId,
      participantBUserId: chat.participantBUserId,
      bookingId: chat.bookingId,
    })
    .from(chat)
    .where(eq(chat.id, chatId));

  if (!chatRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isParticipant =
    chatRow.participantAUserId === me ||
    chatRow.participantBUserId === me;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (chatRow.type === "support") {
    return NextResponse.json(
      { error: "Чат підтримки не можна видалити" },
      { status: 403 }
    );
  }

  if (chatRow.type === "booking" && chatRow.bookingId) {
    const [b] = await db
      .select({ status: booking.status })
      .from(booking)
      .where(eq(booking.id, chatRow.bookingId));
    if (b && b.status === "active") {
      return NextResponse.json(
        { error: "Спершу скасуй або заверши запис" },
        { status: 409 }
      );
    }
  }

  await db.delete(chat).where(eq(chat.id, chatId));

  return NextResponse.json({ ok: true });
}
