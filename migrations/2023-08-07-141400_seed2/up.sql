-- Items
INSERT INTO items (item_id, name, description, value, color, is_image, image_path_full_res, image_preview_height, image_height, image_width, image_data_url, is_image_data, is_masked, is_text, is_code, is_link, is_video, has_emoji, has_masked_words, links, detected_language, is_active, is_disabled, is_deleted, is_folder, is_separator, is_board, is_menu, is_clip, is_protected, is_pinned, size, layout, show_description, created_at, updated_at, created_date, updated_date)
VALUES ('e5DWNga23mqAQAGPEZIIY', 'Menu Demo', 'This is a description for Menu Demo', 'Menu Demo Text', '', FALSE, NULL, 0, 0, 0, NULL, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, NULL, NULL, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, NULL, NULL, TRUE, 1685592000, 1685592000, '2023-06-01 00:00:00', '2023-06-01 00:00:00');

INSERT INTO items (item_id, name, description, value, color, is_image, image_path_full_res, image_preview_height, image_height, image_width, image_data_url, is_image_data, is_masked, is_text, is_code, is_link, is_video, has_emoji, has_masked_words, links, detected_language, is_active, is_disabled, is_deleted, is_folder, is_separator, is_board, is_menu, is_clip, is_protected, is_pinned, size, layout, show_description, created_at, updated_at, created_date, updated_date)
VALUES ('iIjaw3FUqVqlpkXgF3C7U', '-', 'This is a description for Menu Item 1', '-', '', FALSE, NULL, 0, 0, 0, NULL, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, NULL, NULL, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE, TRUE, FALSE, FALSE, FALSE, NULL, NULL, TRUE, 1685592000, 1685592000, '2023-06-01 00:00:00', '2023-06-01 00:00:00');

INSERT INTO items (item_id, name, description, value, color, is_image, image_path_full_res, image_preview_height, image_height, image_width, image_data_url, is_image_data, is_masked, is_text, is_code, is_link, is_video, has_emoji, has_masked_words, links, detected_language, is_active, is_disabled, is_deleted, is_folder, is_separator, is_board, is_menu, is_clip, is_protected, is_pinned, size, layout, show_description, created_at, updated_at, created_date, updated_date)
VALUES ('IoB81DoQPlJ2PihCiA38j', 'Menu Demo 2', 'This is a description for Menu Demo 2', 'Menu Demo 2 Text', '', FALSE, NULL, 0, 0, 0, NULL, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, NULL, NULL, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, NULL, NULL, TRUE, 1685592000, 1685592000, '2023-06-01 00:00:00', '2023-06-01 00:00:00');

INSERT INTO items (item_id, name, description, value, color, is_image, image_path_full_res, image_preview_height, image_height, image_width, image_data_url, is_image_data, is_masked, is_text, is_code, is_link, is_video, has_emoji, has_masked_words, links, detected_language, is_active, is_disabled, is_deleted, is_folder, is_separator, is_board, is_menu, is_clip, is_protected, is_pinned, size, layout, show_description, created_at, updated_at, created_date, updated_date)
VALUES ('ZSHe3S5w6XAU0OOhHBAsn', 'Menu Folder', 'This is a description for Menu Folder', 'folder', '', FALSE, NULL, 0, 0, 0, NULL, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, NULL, NULL, TRUE, FALSE, FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, NULL, NULL, TRUE, 1685592000, 1685592000, '2023-06-01 00:00:00', '2023-06-01 00:00:00');

-- Associating Menu Demo with the Default Menu collection
INSERT INTO collection_menu (collection_id, item_id, parent_id, order_number)
VALUES ('Oo30wUZZ0j3n1ILexXOdx', 'e5DWNga23mqAQAGPEZIIY', NULL, 1);

-- Associating Separator with the Default Menu collection
INSERT INTO collection_menu (collection_id, item_id, parent_id, order_number)
VALUES ('Oo30wUZZ0j3n1ILexXOdx', 'iIjaw3FUqVqlpkXgF3C7U', NULL, 2);

-- Associating Menu Folder with the Default Menu collection
INSERT INTO collection_menu (collection_id, item_id, parent_id, order_number)
VALUES ('Oo30wUZZ0j3n1ILexXOdx', 'ZSHe3S5w6XAU0OOhHBAsn', NULL, 4);

-- Associating Menu Demo 2 with the Menu Folder inside the Default Menu collection
INSERT INTO collection_menu (collection_id, item_id, parent_id, order_number)
VALUES ('Oo30wUZZ0j3n1ILexXOdx', 'IoB81DoQPlJ2PihCiA38j', 'ZSHe3S5w6XAU0OOhHBAsn', 1);
