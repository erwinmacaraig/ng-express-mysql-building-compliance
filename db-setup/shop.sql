CREATE TABLE products (
    product_id INT NOT NULL AUTO_INCREMENT,
    product_code VARCHAR(45),
    product_type VARCHAR(50),
    amount DECIMAL (12,2) DEFAULT 0.00,
    product_desc LONGTEXT,
    product_image VARCHAR(255),
    product_title VARCHAR(100),
    product_timestamp DATETIME DEFAULT current_timestamp,
    archived TINYINT(4) DEFAULT 0,
    CONSTRAINT PRIMARY KEY (product_id)
)engine=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8; 

CREATE TABLE gateway_translog (
    translog_id INT NOT NULL AUTO_INCREMENT,
    gateway_response_payment_id VARCHAR(50),
    gateway_response_amount DECIMAL(16,2) DEFAULT 0.00,
    gateway_response_state VARCHAR(45),    
    payment_gateway VARCHAR(45),
    sent_to_gateway TINYINT(4) DEFAULT 0,
    log_date DATETIME DEFAULT current_timestamp,
    CONSTRAINT PRIMARY KEY (translog_id)
)engine=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE transactions (
    transaction_id INT NOT NULL AUTO_INCREMENT,    
    user_id INT NOT NULL DEFAULT 0,
    translog_id INT NOT NULL DEFAULT 0,
    product_id INT NOT NULL DEFAULT 0,
    quantity INT NOT NULL DEFAULT 0,
    amount DECIMAL(12,2) DEFAULT 0.00,
    status TINYINT(4) DEFAULT 0,
    transaction_date DATETIME DEFAULT current_timestamp,
    date_paid DATETIME,
    CONSTRAINT PRIMARY KEY (transaction_id)
)engine=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;