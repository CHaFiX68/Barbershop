import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat, message } from "@/lib/db/schema";
import { buildPreview, MAX_MESSAGE_LEN, trimMessageBody } from "@/lib/chat-utils";

export const dynamic = "force-dynamic";

const sendSchema = z
  .object({
    body: z.string().max(MAX_MESSAGE_LEN),
    attachmentUrl: z.string().url().optional(),
    attachmentType: z
      .enum(["image/jpeg", "image/png", "image/webp"])
      .optional(),
  })
  .refine((d) => d.body.trim().length > 0 || !!d.attachmentUrl, {
    message: "Body or attachment required",
  });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const me = session.user.id;
    const { id: chatId } = await params;

    const raw = await request.json().catch(() => null);
    const parsed = sendSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const trimmed = trimMessageBody(parsed.data.body);
    const attachmentUrl = parsed.data.attachmentUrl ?? null;
    const attachmentType = parsed.data.attachmentType ?? null;
    if (trimmed.length === 0 && !attachmentUrl) {
      return NextResponse.json(
        { error: "Empty message" },
        { status: 400 }
      );
    }

    const [chatRow] = await db
      .select({
        id: chat.id,
        status: chat.status,
        participantAUserId: chat.participantAUserId,
        participantBUserId: chat.participantBUserId,
      })
      .from(chat)
      .where(eq(chat.id, chatId));

    if (!chatRow) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    if (
      chatRow.participantAUserId !== me &&
      chatRow.participantBUserId !== me
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (chatRow.status !== "active") {
      return NextResponse.json(
        { error: "Чат архівований" },
        { status: 403 }
      );
    }

    const isA = chatRow.participantAUserId === me;
    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(message).values({
      id,
      chatId,
      senderUserId: me,
      body: trimmed,
      attachmentUrl,
      attachmentType,
      createdAt: now,
      // Sender's own message is "read" by themselves (so it doesn't show
      // as unread in their own unread count).
      readByA: isA,
      readByB: !isA,
    });

    await db
      .update(chat)
      .set({
        lastMessageAt: now,
        lastMessagePreview:
          trimmed.length > 0
            ? buildPreview(trimmed)
            : attachmentUrl
              ? "📷 Photo"
              : "",
      })
      .where(eq(chat.id, chatId));

    return NextResponse.json({
      id,
      body: trimmed,
      attachmentUrl,
      attachmentType,
      createdAt: now.toISOString(),
    });
  } catch (err) {
    console.error("[CHAT-SEND] error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
