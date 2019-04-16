DROP TABLE IF EXISTS offline_training_to_certification_relation;
CREATE TABLE offline_training_to_certification_relation (
	offline_training_to_certification_relation_id INT NOT NULL AUTO_INCREMENT,
	certifications_id INT,
    location_id INT DEFAULT 0,
    building_id INT DEFAULT 0,
    location_name VARCHAR(255) DEFAULT NULL,
    ttTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PRIMARY KEY (offline_training_to_certification_relation_id),
    CONSTRAINT FOREIGN KEY (certifications_id) REFERENCES certifications (certifications_id),
    CONSTRAINT UNIQUE KEY cert_uniq (certifications_id)
) engine=InnoDB charset=utf8 AUTO_INCREMENT=0;