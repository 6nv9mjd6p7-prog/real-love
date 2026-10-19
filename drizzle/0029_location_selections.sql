CREATE TABLE `location_selections` (
  `token` text PRIMARY KEY NOT NULL,
  `member` text NOT NULL,
  `place` text NOT NULL,
  `expires` text NOT NULL
);
CREATE INDEX `idx_location_selections_member_expiry` ON `location_selections` (`member`,`expires`);
