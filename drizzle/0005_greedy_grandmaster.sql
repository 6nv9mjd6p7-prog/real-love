CREATE TABLE `contact_limits` (
	`a` text NOT NULL,
	`b` text NOT NULL,
	`closed_by` text NOT NULL,
	`allowed` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`a`, `b`)
);

--> statement-breakpoint
UPDATE profiles SET data=json_set(data,'$.photoPending',json('true')) WHERE json_extract(data,'$.photoKey') IS NOT NULL;
--> statement-breakpoint
UPDATE reports SET expires=strftime('%Y-%m-%dT%H:%M:%fZ',created,'+90 days') WHERE expires='';
--> statement-breakpoint
INSERT OR IGNORE INTO contact_limits (a,b,closed_by,allowed) SELECT CASE WHEN sender<recipient THEN sender ELSE recipient END,CASE WHEN sender<recipient THEN recipient ELSE sender END,COALESCE(closed_by,recipient),'' FROM connections WHERE status='closed';

--> statement-breakpoint
UPDATE connections SET closed_by=recipient WHERE status='closed' AND closed_by IS NULL;
