CREATE TABLE `moderation_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`reason` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `moderators` (
	`id` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `safety_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`until` text DEFAULT '' NOT NULL,
	`notice` text DEFAULT '' NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `safety_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`kind` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_safety_events_actor` ON `safety_events` (`actor`,`kind`,`created`);--> statement-breakpoint
ALTER TABLE `circle_members` ADD `joined` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `connections` ADD `closed_by` text;--> statement-breakpoint
ALTER TABLE `connections` ADD `reconnect` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `connections` ADD `sender_photo` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `connections` ADD `recipient_photo` integer DEFAULT 0 NOT NULL;