DROP TABLE IF EXISTS reward_activity_lookup;
CREATE TABLE reward_activity_lookup (
	reward_activity_lookup_id INT NOT NULL AUTO_INCREMENT,
	activity_name VARCHAR(100),
	default_points INT,
    CONSTRAINT PRIMARY KEY (reward_activity_lookup_id)
)engine=InnoDB AUTO_INCREMENT=0 CHARSET=utf8;