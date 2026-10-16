CREATE TABLE `circle_activity_participants` (
	`message` text NOT NULL,
	`member` text NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`message`, `member`)
);
--> statement-breakpoint
CREATE INDEX `idx_activity_participant_member` ON `circle_activity_participants` (`member`);--> statement-breakpoint
ALTER TABLE `circle_messages` ADD `cooperation_starts_at` text DEFAULT '' NOT NULL;