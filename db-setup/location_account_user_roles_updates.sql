UPDATE
    location_account_user
INNER JOIN
    user_em_roles_relation
ON location_account_user.user_id = user_em_roles_relation.user_id
SET location_account_user.role_id = user_em_roles_relation.em_role_id
WHERE location_account_user.role_id = 0
AND location_account_user.location_id = user_em_roles_relation.location_id;


UPDATE
    location_account_user
INNER JOIN
    user_role_relation
ON location_account_user.user_id = user_role_relation.user_id
SET location_account_user.role_id = user_role_relation.role_id
WHERE location_account_user.role_id = 0
AND location_account_user.user_id = user_role_relation.user_id;