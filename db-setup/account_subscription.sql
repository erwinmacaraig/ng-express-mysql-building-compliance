DROP TABLE IF EXISTS account_subscription;
CREATE TABLE account_subscription (
    account_subscription_id INT NOT NULL AUTO_INCREMENT,    
    account_id INT,
    type VARCHAR(255) DEFAULT 'free',
    bulk_license_total INT DEFAULT -1,
    valid_till DATE,
    enabled TINYINT DEFAULT 1,
    CONSTRAINT PRIMARY KEY (account_subscription_id),
    CONSTRAINT FOREIGN KEY (account_id) REFERENCES accounts (account_id),
    CONSTRAINT account_constraint UNIQUE (account_id)
) engine=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS subscription_feature;
CREATE TABLE subscription_feature (
    subscription_feature_id INT NOT NULL AUTO_INCREMENT,
    subscription_type VARCHAR(255),
    feature VARCHAR(255),
    description MEDIUMTEXT,
    value INT DEFAULT -1,
    CONSTRAINT PRIMARY KEY (subscription_feature_id)
) engine=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS subscription_to_location_relation;
CREATE TABLE subscription_to_location_relation (
    subscription_to_location_relation_id INT NOT NULL AUTO_INCREMENT,
    account_subscription_id INT,
    account_id INT,
    building_id INT,
    level_id INT,
    CONSTRAINT PRIMARY KEY (subscription_to_location_relation_id),
    CONSTRAINT FOREIGN KEY (account_subscription_id) REFERENCES account_subscription(account_subscription_id)
) engine=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

INSERT INTO account_subscription (account_id, type, bulk_license_total, valid_till, enabled)
SELECT account_id, 'premium', -1, '2020-03-19', 1
FROM accounts WHERE archived = 0;