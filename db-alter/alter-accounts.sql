ALTER TABLE accounts
  ADD COLUMN building_number VARCHAR(50) NOT NULL AFTER account_name,
  ADD COLUMN key_contact VARCHAR(250) NOT NULL AFTER account_domain,
  ADD COLUMN time_zone VARCHAR(250) NOT NULL AFTER key_contact;
