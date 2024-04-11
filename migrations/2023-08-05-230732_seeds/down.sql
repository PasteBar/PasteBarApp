-- This file should undo anything in `up.sql`
-- DELETE COLLECTIONS
DELETE FROM collections 
WHERE collection_id = 'fccb5ea8-33e4-11ee-be56-0242ac120002';

-- DELETE VALUE_TYPES
DELETE FROM value_types WHERE type_id = 'EXog1zZzYpkV8R7ZCvWCI';
DELETE FROM value_types WHERE type_id = 'sHUxI9W55gEHjiEk_OuGc';
DELETE FROM value_types WHERE type_id = 'YFbGezLZW0GejzGeTdFAt';
DELETE FROM value_types WHERE type_id = 'TpXVO73QXx4zyoHPHL9Nh';
DELETE FROM value_types WHERE type_id = 'UjxFQu2MZk22K36dyyIeX';
DELETE FROM value_types WHERE type_id = 'EwLiFgwu0S3XtwWiXjWXZ';
DELETE FROM value_types WHERE type_id = 'lHjwdS6blyg5KJ6AkEPvb';
DELETE FROM value_types WHERE type_id = 'Kcz9h7pzpk8lVG7LhqNLf';
DELETE FROM value_types WHERE type_id = '7x1Y7MceEtsfR9KwR2yza';
DELETE FROM value_types WHERE type_id = '3ZAvNmOzHbrxOgmaiKiYW';
DELETE FROM value_types WHERE type_id = 'rdx1qwTva0By5l49fyKEg';

-- DELETE ITEMS
DELETE FROM items WHERE item_id = 'e5DWNga23mqAQAGPEZIIY';
DELETE FROM items WHERE item_id = 'iIjaw3FUqVqlpkXgF3C7U';
DELETE FROM items WHERE item_id = 'oVB7PmYmo9JoAAB0c1Oal';
DELETE FROM items WHERE item_id = 'IoB81DoQPlJ2PihCiA38j';
DELETE FROM items WHERE item_id = 'ZSHe3S5w6XAU0OOhHBAsn';

-- DELETE HISTORY ITEMS
DELETE FROM clipbaord_history WHERE history_id = 'EXog1zZzYpkV8R7ZCvWCZ';

-- DELETE HISTORY ITEMS
DELETE FROM settings WHERE key === 'isHistoryEnabled'
DELETE FROM settings WHERE key === 'isFirstRun'