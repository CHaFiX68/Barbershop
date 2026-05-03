ALTER TABLE "service" ADD COLUMN "estimated_minutes" integer;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "buffer_minutes" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "service_pending" ADD COLUMN "estimated_minutes" integer;--> statement-breakpoint
ALTER TABLE "service_pending" ADD COLUMN "buffer_minutes" integer DEFAULT 5;--> statement-breakpoint
UPDATE "service" SET "buffer_minutes" = 5 WHERE "buffer_minutes" IS NULL;--> statement-breakpoint
UPDATE "service_pending" SET "buffer_minutes" = 5 WHERE "buffer_minutes" IS NULL;
