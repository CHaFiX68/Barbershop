CREATE TABLE "work_photo" (
	"id" text PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
