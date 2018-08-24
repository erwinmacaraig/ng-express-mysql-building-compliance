CREATE TABLE paper_attendance_docs (
	paper_attendance_docs_id INT NOT NULL auto_increment,
	dtTraining date,
	intTrainingCourse INT,
	intUploadedBy INT,
	strOriginalfilename VARCHAR(255),    
	dtUploaded datetime DEFAULT current_timestamp,
	CONSTRAINT PRIMARY KEY (paper_attendance_docs_id)
) engine=InnoDB AUTO_INCREMENT = 0 DEFAULT CHARSET=utf8;