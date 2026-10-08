CREATE TABLE `circle_members` (
	`circle` text NOT NULL,
	`member` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	PRIMARY KEY(`circle`, `member`)
);
--> statement-breakpoint
CREATE TABLE `circle_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`circle` text NOT NULL,
	`sender` text NOT NULL,
	`body` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_circle_messages_circle` ON `circle_messages` (`circle`);--> statement-breakpoint
CREATE TABLE `circles` (
	`id` text PRIMARY KEY NOT NULL,
	`founder_a` text NOT NULL,
	`founder_b` text NOT NULL,
	`connection` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`tags` text NOT NULL,
	`activity` text NOT NULL,
	`status` text NOT NULL,
	`proposer` text NOT NULL,
	`created` text NOT NULL
);
