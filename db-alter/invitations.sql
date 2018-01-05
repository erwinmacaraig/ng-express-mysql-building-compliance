ALTER TABLE users ADD COLUMN invited_by_user INT NOT NULL DEFAULT 0 AFTER user_id;
RENAME TABLE invitation_codes TO user_invitations;
ALTER TABLE token ADD COLUMN id int not null default 0, ADD COLUMN id_type varchar(50) DEFAULT NULL;
ALTER TABLE user_invitations DROP COLUMN code;
