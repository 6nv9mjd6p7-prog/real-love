CREATE TABLE `campaign_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign` text NOT NULL,
	`actor` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `campaign_participation` (
	`campaign` text NOT NULL,
	`member` text NOT NULL,
	PRIMARY KEY(`campaign`, `member`)
);
--> statement-breakpoint
CREATE TABLE `campaign_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign` text NOT NULL,
	`body` text NOT NULL,
	`kind` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	`reviewer` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`creator` text NOT NULL,
	`data` text NOT NULL,
	`status` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
