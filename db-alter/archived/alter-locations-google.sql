ALTER TABLE locations ADD COLUMN formatted_address varchar(255) DEFAULT NULL AFTER country,
ADD COLUMN lat varchar(50) DEFAULT NULL AFTER formatted_address,
ADD COLUMN lng varchar(50) DEFAULT NULL AFTER lat,
ADD COLUMN google_place_id varchar(50) DEFAULT NULL AFTER archived,
ADD COLUMN google_photo_url varchar(255) DEFAULT NULL AFTER google_place_id;