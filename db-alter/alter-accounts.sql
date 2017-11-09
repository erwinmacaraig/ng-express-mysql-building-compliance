ALTER TABLE accounts
  ADD COLUMN trp_code VARCHAR(255) DEFAULT NULL AFTER epc_committee_on_hq,
  ADD COLUMN account_domain VARCHAR(255) DEFAULT NULL AFTER trp_code;
  ADD COLUMN building_number VARCHAR(50) NOT NULL AFTER account_name;
  ADD COLUMN key_contact VARCHAR(250) NOT NULL AFTER account_domain;
  ADD COLUMN time_zone VARCHAR(250) NOT NULL AFTER key_contact;
