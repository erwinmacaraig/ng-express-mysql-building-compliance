ALTER TABLE user_invitations ADD COLUMN phone_number VARCHAR(15) AFTER contact_number,
ADD COLUMN can_login INT(1) NOT NULL DEFAULT 0 AFTER invited_by_user,
ADD COLUMN time_zone VARCHAR(25);
