CREATE TABLE `direct_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`connection` text NOT NULL,
	`creator` text NOT NULL,
	`kind` text NOT NULL,
	`description` text NOT NULL,
	`timing` text DEFAULT '' NOT NULL,
	`starts_at` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'proposed' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_direct_plans_connection` ON `direct_plans` (`connection`);