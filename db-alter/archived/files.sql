CREATE TABLE files (
  file_id int(11) NOT NULL,
  file_name varchar(255) NOT NULL,
  url varchar(255) NOT NULL,
  directory varchar(255) NOT NULL,
  uploaded_by int(11) NOT NULL,
  datetime datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE file_user (
  file_user_id int(11) NOT NULL,
  user_id int(11) NOT NULL,
  file_id int(11) NOT NULL,
  type tinytext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


ALTER TABLE files
  ADD PRIMARY KEY (file_id);

ALTER TABLE file_user
  ADD PRIMARY KEY (file_user_id);


ALTER TABLE files
  MODIFY file_id int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

ALTER TABLE file_user
  MODIFY file_user_id int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;