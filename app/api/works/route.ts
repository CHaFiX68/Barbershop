import { NextResponse } from "next/server";
import { getWorkPhotos } from "@/lib/works";

export const dynamic = "force-dynamic";

export async function GET() {
  const works = await getWorkPhotos();
  return NextResponse.json({ works });
}
