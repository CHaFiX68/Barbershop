import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

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

    const [chatRow] = await db
      .select({
        participantAUserId: chat.participantAUserId,
        participantBUserId: chat.participantBUserId,
        status: chat.status,
      })
      .from(chat)
      .where(eq(chat.id, chatId));
    if (!chatRow)
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    if (
      chatRow.participantAUserId !== me &&
      chatRow.participantBUserId !== me
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (chatRow.status !== "active") {
      return NextResponse.json({ error: "Chat archived" }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const ext =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : "webp";
    const filename = `chat-attachments/${chatId}/${crypto.randomUUID()}.${ext}`;
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url, type: file.type });
  } catch (err) {
    console.error("[CHAT-ATTACHMENT-UPLOAD] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
