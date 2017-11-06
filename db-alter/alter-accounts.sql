ALTER TABLE accounts
  ADD COLUMN trp_code VARCHAR(255) DEFAULT NULL AFTER epc_committee_on_hq,
  ADD COLUMN account_domain VARCHAR(255) DEFAULT NULL AFTER trp_code;
