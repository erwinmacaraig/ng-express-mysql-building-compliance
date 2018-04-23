UPDATE `compliance_kpis` 
SET `name` = 'Sundry Compliance', `directory_name` = 'SundryCompliance', 
`measurement` = 'none', `required` = '0', 
`description` = 'This section records documentation with regards to emergency planning activity conducted at the facility.' 
WHERE `compliance_kpis`.`compliance_kpis_id` = 13;