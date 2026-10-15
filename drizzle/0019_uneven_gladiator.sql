ALTER TABLE `circle_messages` ADD `attachment_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `circle_messages` ADD `attachment_type` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `attachment_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `attachment_type` text DEFAULT '' NOT NULL;
