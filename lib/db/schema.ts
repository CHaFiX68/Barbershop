import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type DaySchedule = {
  enabled: boolean;
  startMinutes: number;
  endMinutes: number;
  breakStartMinutes: number | null;
  breakEndMinutes: number | null;
};

export type WeekSchedule = {
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
  sun: DaySchedule;
};

export const userRole = pgEnum("user_role", ["user", "barber", "admin"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRole("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const barberProfile = pgTable("barber_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),
  phone: text("phone"),
  bio: text("bio"),
  landingImage: text("landing_image"),
  isActive: boolean("is_active").notNull().default(false),
  schedule: jsonb("schedule").$type<WeekSchedule>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const service = pgTable("service", {
  id: text("id").primaryKey(),
  barberUserId: text("barber_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: text("price").notNull(),
  estimatedMinutes: integer("estimated_minutes"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const barberProfilePending = pgTable("barber_profile_pending", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),
  phone: text("phone"),
  bio: text("bio"),
  landingImage: text("landing_image"),
  isActive: boolean("is_active").notNull().default(false),
  schedule: jsonb("schedule").$type<WeekSchedule>(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const servicePending = pgTable("service_pending", {
  id: text("id").primaryKey(),
  barberUserId: text("barber_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: text("price").notNull(),
  estimatedMinutes: integer("estimated_minutes"),
  orderIndex: integer("order_index").notNull().default(0),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const contentBlock = pgTable("content_block", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const heroSlide = pgTable("hero_slide", {
  id: text("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const booking = pgTable("booking", {
  id: text("id").primaryKey(),
  customerUserId: text("customer_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  barberUserId: text("barber_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  serviceId: text("service_id").references(() => service.id, {
    onDelete: "set null",
  }),
  serviceName: text("service_name").notNull(),
  servicePrice: text("service_price").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  bufferMinutes: integer("buffer_minutes").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
});

export type ChatType = "booking" | "support" | "direct_admin";

export const chat = pgTable(
  "chat",
  {
    id: text("id").primaryKey(),
    // ChatType: "booking" (customer↔barber per booking),
    // "support" (customer↔admin), "direct_admin" (admin↔barber direct).
    // For direct_admin: participantA = admin, participantB = barber.
    type: text("type").$type<ChatType>().notNull(),
    status: text("status").notNull().default("active"),
    bookingId: text("booking_id").references(() => booking.id, {
      onDelete: "set null",
    }),
    participantAUserId: text("participant_a_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    participantBUserId: text("participant_b_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessagePreview: text("last_message_preview"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    archivedAt: timestamp("archived_at"),
  },
  (t) => [
    index("chat_participant_a_status_idx").on(
      t.participantAUserId,
      t.status
    ),
    index("chat_participant_b_status_idx").on(
      t.participantBUserId,
      t.status
    ),
  ]
);

export const message = pgTable(
  "message",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    senderUserId: text("sender_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    readByA: boolean("read_by_a").notNull().default(false),
    readByB: boolean("read_by_b").notNull().default(false),
  },
  (t) => [index("message_chat_created_idx").on(t.chatId, t.createdAt)]
);
