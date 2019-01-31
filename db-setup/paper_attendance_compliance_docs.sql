DROP TABLE IF EXISTS paper_attendance_compliance_docs;
CREATE TABLE paper_attendance_compliance_docs (
    paper_attendance_compliance_docs_id INT NOT NULL AUTO_INCREMENT,
    paper_attendance_docs_id INT,
    account_id INT,
    location_id INT,
    compliance_kpis_id INT,
    training_requirement_id INT,
    dtTraining DATE,
    strOriginalfilename TEXT,
    responsibility VARCHAR(100),
    CONSTRAINT PRIMARY KEY (paper_attendance_compliance_docs_id),
    CONSTRAINT FOREIGN KEY (paper_attendance_docs_id) REFERENCES paper_attendance_docs (paper_attendance_docs_id) ON DELETE CASCADE,
    CONSTRAINT FOREIGN KEY (account_id) REFERENCES accounts (account_id) ON DELETE CASCADE,
    CONSTRAINT FOREIGN KEY (location_id) REFERENCES locations (location_id) ON DELETE CASCADE,
    CONSTRAINT FOREIGN KEY (compliance_kpis_id) REFERENCES compliance_kpis (compliance_kpis_id),
    CONSTRAINT FOREIGN KEY (training_requirement_id) REFERENCES training_requirement (training_requirement_id)
) engine=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;