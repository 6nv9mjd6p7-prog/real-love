ALTER TABLE `circles` ADD `category` text DEFAULT 'friendship' NOT NULL;--> statement-breakpoint
ALTER TABLE `circles` ADD `membership_rules` text DEFAULT '' NOT NULL;