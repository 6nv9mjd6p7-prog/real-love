CREATE TABLE `reinvite_permission_requests` (
	`connection` text PRIMARY KEY NOT NULL,
	`requester` text NOT NULL,
	`recipient` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created` text NOT NULL,
	`responded` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reinvite_permission_recipient_status` ON `reinvite_permission_requests` (`recipient`,`status`);