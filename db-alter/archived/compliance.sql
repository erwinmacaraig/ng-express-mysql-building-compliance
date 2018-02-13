ALTER TABLE `compliance_kpis` ADD `description` TINYTEXT NULL DEFAULT NULL AFTER `training_id`;

ALTER TABLE `compliance` ADD `note` TINYTEXT NULL DEFAULT NULL;

INSERT INTO `compliance_kpis` (`compliance_kpis_id`, `name`, `directory_name`, `measurement`, `required`, `validity_in_months`, `order`, `has_primary_document`, `ER_id`, `training_id`, `description`) VALUES ('12', 'Chief Warden Training', 'ChiefWardenTraining', 'Precent', 1, 12, NULL, 1, 11, NULL, 'This training covers skills and knowledge necessary to effectively perform the duties of a Chief Warden as per the requirements of AS3745.');

INSERT INTO `compliance_kpis` (`compliance_kpis_id`, `name`, `directory_name`, `measurement`, `required`, `validity_in_months`, `order`, `has_primary_document`, `ER_id`, `training_id`, `description`) VALUES ('13', 'Warden Lists', 'WardenLists', 'Precent', 1, 12, NULL, 1, NULL, NULL, 'Warden List should be regularly reviewed and assessed for any significant changes so that new measures to mitigate emergencies can be developed.');

UPDATE `compliance_kpis` SET `name` = 'Fire Safety Advisor' WHERE  `compliance_kpis_id` = 3;
UPDATE `compliance_kpis` SET `name` = 'Evac Diagram' WHERE  `compliance_kpis_id` = 5;
UPDATE `compliance_kpis` SET `name` = 'Warden Training' WHERE  `compliance_kpis_id` = 6;
UPDATE `compliance_kpis` SET `name` = 'General Occupant Training' WHERE  `compliance_kpis_id` = 8;


UPDATE `compliance_kpis` SET `description` = "The Emergency Planning Committee develops the emergency plan, emergency response procedures and takes an active role in forming the Emergency Control Organisation (ECO)." WHERE  `compliance_kpis_id` = 2;

UPDATE `compliance_kpis` SET `description` = "A Fire Safety Advisor's main role is to render qualified advice to all tenants, managers, and building owners on all applicable aspects of emergency procedures." WHERE  `compliance_kpis_id` = 3;

UPDATE `compliance_kpis` SET `description` = "The Emergency Procedures Manual provides specific procedures and guidelines for dealing with various types of emergency." WHERE  `compliance_kpis_id` = 4;

UPDATE `compliance_kpis` SET `description` = "Floor plan of a facility which helps occupants in locating nearest emergency evacuation path to assembly area." WHERE  `compliance_kpis_id` = 5;

UPDATE `compliance_kpis` SET `description` = "AS3745 requires Wardens to complete required warden training on skills and knowledge specific to their duties." WHERE  `compliance_kpis_id` = 6;

UPDATE `compliance_kpis` SET `description` = "A person that resides in a building or facility. General occupants need to understand the nature of potential emergencies and what actions to take if emergencies do occur." WHERE  `compliance_kpis_id` = 8;

UPDATE `compliance_kpis` SET `description` = "A method of practicing how a building would be evacuated in the event of emergencies. AS3745 requires all facilities to participate in at least one evacuation exercise each year to test the emergency plan’s effectiveness." WHERE  `compliance_kpis_id` = 9;




