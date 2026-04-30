import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { barberProfile, user } from "@/lib/db/schema";

const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id));
    if (
      !currentUser ||
      (currentUser.role !== "barber" && currentUser.role !== "admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only images allowed" },
        { status: 400 }
      );
    }

    const filename = `landing/${session.user.id}-${Date.now()}.jpg`;
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    await db
      .update(barberProfile)
      .set({ landingImage: blob.url, updatedAt: new Date() })
      .where(eq(barberProfile.userId, session.user.id));

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    console.error("POST /api/barber/landing-image error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
