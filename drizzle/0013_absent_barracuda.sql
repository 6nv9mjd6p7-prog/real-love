CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`member` text NOT NULL,
	`actor` text DEFAULT '' NOT NULL,
	`kind` text NOT NULL,
	`scope` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`created` text NOT NULL,
	`read` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_member` ON `notifications` (`member`,`created`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`endpoint` text PRIMARY KEY NOT NULL,
	`member` text NOT NULL,
	`updated` text NOT NULL,
	`reviewer` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_push_member` ON `push_subscriptions` (`member`);