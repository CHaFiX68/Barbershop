import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentBlock, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(2000),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [u] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id));
    if (u?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await db
      .insert(contentBlock)
      .values({
        id: crypto.randomUUID(),
        key: parsed.data.key,
        value: parsed.data.value,
      })
      .onConflictDoUpdate({
        target: contentBlock.key,
        set: { value: parsed.data.value, updatedAt: new Date() },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/admin/content PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
