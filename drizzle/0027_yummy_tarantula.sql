CREATE TABLE `reviewer_invitations` (
	`member` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`issuer` text NOT NULL,
	`authority` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created` text NOT NULL,
	`expires` text NOT NULL,
	`decision_id` text DEFAULT '' NOT NULL,
	`decided` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reviewer_invitation_id` ON `reviewer_invitations` (`id`);