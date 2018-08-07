CREATE TABLE notification_config (
    notification_config_id INT NOT NULL AUTO_INCREMENT,
    building_id INT,
    user_type VARCHAR(10),
    message LONGTEXT,
    frequency INT(3),
    recipients INT,
    responders INT,
    building_manager INT,
    dtLastSent DATETIME,
    CONSTRAINT PRIMARY KEY (notification_config_id)
) engine=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;