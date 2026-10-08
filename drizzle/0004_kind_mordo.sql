ALTER TABLE `reports` ADD `context` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD `evidence` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD `expires` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD `resolution` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX idx_connections_live_pair ON connections (CASE WHEN sender<recipient THEN sender ELSE recipient END, CASE WHEN sender<recipient THEN recipient ELSE sender END) WHERE status IN ('pending','accepted');
--> statement-breakpoint
UPDATE circle_members SET joined=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE joined='';
