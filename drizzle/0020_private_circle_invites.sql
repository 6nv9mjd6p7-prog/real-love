CREATE TABLE `circle_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`circle` text NOT NULL,
	`inviter` text NOT NULL,
	`invitee` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created` text NOT NULL,
	`expires` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_circle_invites_invitee` ON `circle_invites` (`invitee`,`status`,`expires`);--> statement-breakpoint
CREATE INDEX `idx_circle_invites_circle` ON `circle_invites` (`circle`,`status`);