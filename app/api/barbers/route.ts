import { NextResponse } from "next/server";
import { getBarbers } from "@/lib/barbers";

export const dynamic = "force-dynamic";

export async function GET() {
  const barbers = await getBarbers();
  return NextResponse.json({ barbers });
}
