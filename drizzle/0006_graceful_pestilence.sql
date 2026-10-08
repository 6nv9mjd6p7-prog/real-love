ALTER TABLE `circle_members` ADD `history_after` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE circle_members SET history_after=(SELECT COALESCE(MAX(rowid),0) FROM circle_messages WHERE circle=circle_members.circle);
