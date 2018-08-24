CREATE TABLE notification_token (
	notification_token_id INT NOT NULL AUTO_INCREMENT,
    strToken VARCHAR(255),
    user_id INT,
    notification_config_id INT,
    dtExpiration DATE,
    responded BOOLEAN DEFAULT 0,
    dtResponded DATE DEFAULT '0000-00-00',
    completed BOOLEAN DEFAULT 0,
    dtCompleted DATE DEFAULT '0000-00-00',
    strResponse LONGTEXT,
    CONSTRAINT PRIMARY KEY (notification_token_id)
)engine=InnoDB AUTO_INCREMENT = 0 DEFAULT CHARSET=utf8;