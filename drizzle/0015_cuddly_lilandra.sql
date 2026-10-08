ALTER TABLE `circle_messages` ADD `audio_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `circle_messages` ADD `audio_type` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `circle_messages` ADD `audio_duration` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `circle_messages` ADD `edited_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `circle_messages` ADD `deleted_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `circle_messages` ADD `edit_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `circle_messages` ADD `edit_history` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `audio_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `audio_type` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `audio_duration` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `edited_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `deleted_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `edit_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `edit_history` text DEFAULT '[]' NOT NULL;