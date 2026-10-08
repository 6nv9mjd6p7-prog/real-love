CREATE TABLE `notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`member` text NOT NULL,
	`scope` text NOT NULL,
	`muted` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notification_preferences_member` ON `notification_preferences` (`member`);--> statement-breakpoint
CREATE TABLE `product_events` (
	`id` text PRIMARY KEY NOT NULL,
	`member` text NOT NULL,
	`kind` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_product_events_member` ON `product_events` (`member`);--> statement-breakpoint
CREATE INDEX `idx_product_events_kind` ON `product_events` (`kind`);