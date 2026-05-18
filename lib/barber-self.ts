import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import {
  barberProfile,
  barberProfilePending,
  service,
  servicePending,
  type WeekSchedule,
} from "./db/schema";
import { normalizeWeekSchedule } from "./schedule";

export type BarberSelfProfile = {
  profile: {
    phone: string;
    bio: string;
    landingImage: string | null;
    isActive: boolean;
    schedule: WeekSchedule;
  };
  services: {
    id: string;
    name: string;
    price: string;
    estimatedMinutes: number | null;
  }[];
  hasPendingChanges: boolean;
};

/**
 * Pending-first read of a barber's own profile + services.
 * Mirrors /api/barber/me logic: if a pending submission exists, return it;
 * otherwise fall back to the approved barber_profile. Returns null when neither
 * exists (caller decides — redirect, auto-create, etc.).
 */
export async function getBarberSelfProfile(
  userId: string
): Promise<BarberSelfProfile | null> {
  const [pendingProfile] = await db
    .select()
    .from(barberProfilePending)
    .where(eq(barberProfilePending.userId, userId));

  if (pendingProfile) {
    const pendingServices = await db
      .select()
      .from(servicePending)
      .where(eq(servicePending.barberUserId, userId))
      .orderBy(asc(servicePending.orderIndex));

    return {
      profile: {
        phone: pendingProfile.phone ?? "",
        bio: pendingProfile.bio ?? "",
        landingImage: pendingProfile.landingImage,
        isActive: pendingProfile.isActive,
        schedule: normalizeWeekSchedule(pendingProfile.schedule),
      },
      services: pendingServices.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        estimatedMinutes: s.estimatedMinutes,
      })),
      hasPendingChanges: true,
    };
  }

  const [profile] = await db
    .select()
    .from(barberProfile)
    .where(eq(barberProfile.userId, userId));

  if (!profile) return null;

  const services = await db
    .select()
    .from(service)
    .where(eq(service.barberUserId, userId))
    .orderBy(asc(service.orderIndex));

  return {
    profile: {
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
      landingImage: profile.landingImage,
      isActive: profile.isActive,
      schedule: normalizeWeekSchedule(profile.schedule),
    },
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      estimatedMinutes: s.estimatedMinutes,
    })),
    hasPendingChanges: false,
  };
}
