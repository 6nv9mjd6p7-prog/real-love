CREATE TABLE `bookmarks` (
	`member` text NOT NULL,
	`target` text NOT NULL,
	PRIMARY KEY(`member`, `target`)
);
--> statement-breakpoint
CREATE INDEX `idx_bookmarks_target` ON `bookmarks` (`target`);--> statement-breakpoint
CREATE TABLE `conversation_reads` (
	`member` text NOT NULL,
	`connection` text NOT NULL,
	`last_row` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`member`, `connection`)
);
