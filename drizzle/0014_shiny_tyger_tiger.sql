CREATE TABLE `auth_identities` (
	`provider_id` text PRIMARY KEY NOT NULL,
	`member` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_identities_member_unique` ON `auth_identities` (`member`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`member` text NOT NULL,
	`email` text NOT NULL,
	`provider` text NOT NULL,
	`expires` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_member` ON `auth_sessions` (`member`);--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_expiry` ON `auth_sessions` (`expires`);