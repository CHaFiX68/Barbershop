import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "./db";
import { barberProfile, service, user, type WeekSchedule } from "./db/schema";
import { normalizeWeekSchedule } from "./schedule";

export interface BarberPublic {
  id: string;
  name: string;
  phone: string | null;
  bio: string | null;
  landingImage: string | null;
  initials: string;
  services: { name: string; price: string }[];
  schedule: WeekSchedule;
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export async function getBarbers(): Promise<BarberPublic[]> {
  try {
    const rows = await db
      .select({
        userId: user.id,
        name: user.name,
        phone: barberProfile.phone,
        bio: barberProfile.bio,
        landingImage: barberProfile.landingImage,
        schedule: barberProfile.schedule,
      })
      .from(user)
      .innerJoin(barberProfile, eq(barberProfile.userId, user.id))
      .where(
        and(eq(user.role, "barber"), eq(barberProfile.isActive, true))
      );

    const result: BarberPublic[] = [];
    for (const row of rows) {
      const services = await db
        .select({ name: service.name, price: service.price })
        .from(service)
        .where(eq(service.barberUserId, row.userId))
        .orderBy(asc(service.orderIndex));
      if (services.length === 0) continue;

      result.push({
        id: row.userId,
        name: row.name,
        phone: row.phone,
        bio: row.bio,
        landingImage: row.landingImage,
        initials: getInitials(row.name),
        services,
        schedule: normalizeWeekSchedule(row.schedule),
      });
    }
    return result;
  } catch (err) {
    console.error("getBarbers failed:", err);
    return [];
  }
}
