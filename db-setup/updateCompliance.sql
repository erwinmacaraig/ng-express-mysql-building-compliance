UPDATE compliance INNER JOIN compliance_documents
ON (compliance.account_id = compliance_documents.account_id 
AND 
compliance.building_id = compliance_documents.building_id
AND
compliance.compliance_kpis_id = compliance_documents.compliance_kpis_id
) 
SET compliance.valid_till = DATE_ADD(compliance_documents.date_of_activity, INTERVAL 12 MONTH)
WHERE
compliance_documents.date_of_activity != '0000-00-00';