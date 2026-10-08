CREATE TABLE `message_reactions` (
	`kind` text NOT NULL,
	`scope` text NOT NULL,
	`message` text NOT NULL,
	`member` text NOT NULL,
	`emoji` text NOT NULL,
	PRIMARY KEY(`kind`, `scope`, `message`, `member`)
);
--> statement-breakpoint
CREATE INDEX `idx_reactions_member` ON `message_reactions` (`member`);--> statement-breakpoint
ALTER TABLE `circle_messages` ADD `reply_to` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `reply_to` text DEFAULT '' NOT NULL;