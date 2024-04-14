-- Collections
INSERT INTO collections (collection_id, title, description, is_default, is_selected, is_enabled, created_at, updated_at, created_date, updated_date)
VALUES ('Oo30wUZZ0j3n1ILexXOdx', 'Personal collection', 'Your personal menu items collection', TRUE, TRUE, TRUE, 1685592000, 1685592000, '2023-06-01 00:00:00', '2023-06-01 00:00:00');

INSERT INTO collections (collection_id, title, description, is_default, is_selected, is_enabled, created_at, updated_at, created_date, updated_date)
VALUES ('5EoJsePkXxUqby3BvrzKk', 'Work collection', 'Work menu collection for your work related items', FALSE, FALSE, FALSE, 1685592000, 1685592000, '2023-06-01 00:00:00', '2023-06-01 00:00:00');

INSERT INTO collections (collection_id, title, description, is_default, is_selected, is_enabled, created_at, updated_at, created_date, updated_date)
VALUES ('Xw9dvUr0jK19nwdSMRRZH', 'AI prompt collection', 'AI prompt collection to help you boost your creative skills', FALSE, FALSE, FALSE, 1685592000, 1685592000, '2023-06-01 00:00:00', '2023-06-01 00:00:00');


-- Item clipboard_history
INSERT INTO clipboard_history (history_id, title, value, value_preview, value_more_preview_lines, value_more_preview_chars, value_hash, is_image, image_path_full_res, image_data_low_res, image_preview_height, image_height, image_width, image_data_url, image_hash, is_image_data, is_masked, is_text, is_code, is_link, is_video, has_emoji, has_masked_words, links, is_pinned, is_favorite, detected_language, pinned_order_number, created_at, updated_at, created_date, updated_date)
VALUES ('EXog1zZzYpkV8R7ZCvWCZ', 'Clipboard Sample History Text', 'Clipboard sample text', NULL, 0, 0, NULL, FALSE, NULL, NULL, 0, 0, 0, NULL, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, NULL, FALSE, FALSE, NULL, NULL, 1696707981208, 1696707981208, '2023-10-07 19:46:21.208581', '2023-10-07 19:46:21.208581');

-- 3 months old Item clipboard_history
INSERT INTO clipboard_history (history_id, title, value, value_preview, value_more_preview_lines, value_more_preview_chars, value_hash, is_image, image_path_full_res, image_data_low_res, image_preview_height, image_height, image_width, image_data_url, image_hash, is_image_data, is_masked, is_text, is_code, is_link, is_video, has_emoji, has_masked_words, links, is_pinned, is_favorite, detected_language, pinned_order_number, created_at, updated_at, created_date, updated_date)
VALUES ('EXog2zZzYpkV8R7ZCvWCZ', 'Clipboard at least 3 months old Sample History Text', 'Clipboard at least 3 months old sample text', NULL, 0, 0, NULL, FALSE, NULL, NULL, 0, 0, 0, NULL, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, NULL, FALSE, FALSE, NULL, NULL, 1688769981000, 1688769981000, '2023-07-07 19:46:21.208581', '2023-07-07 19:46:21.208581');

-- Settings
INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isFirstRun', NULL, true, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isFirstRunAfterUpdate', NULL, false, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isHistoryEnabled', NULL, true, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isHistoryAutoUpdateOnCaputureEnabled', NULL, true, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isHistoryDetectLanguageEnabled', NULL, true, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('historyDetectLanguageMinLines', NULL, NULL, 3);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isAutoClearSettingsEnabled', NULL, false, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('autoClearSettingsDuration', NULL, NULL, 1);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('autoClearSettingsDurationType', 'months', NULL, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('copyPasteDelay', NULL, NULL, 2);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('copyPasteSequencePinnedDelay', NULL, NULL, 3);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('copyPasteSequenceIsReversOrder', NULL, true, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('pasteSequenceEachSeparator', '', NULL, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('historyDetectLanguagesEnabledList', 'javascript,css,jsx,json,rust', NULL, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isExclusionListEnabled', NULL, false, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('historyExclusionList', '', NULL, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isAutoMaskWordsListEnabled', NULL, false, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isAutoPreviewLinkCardsEnabled', NULL, true, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isAutoFavoriteOnDoubleCopyEnabled', NULL, true, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isIdleScreenAutoLockEnabled', NULL, false, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('idleScreenAutoLockTimeInMinutes', NULL, NULL, 15);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isShowHistoryCaptureOnLockedScreen', NULL, false, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('screenLockPassCode', NULL, NULL, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isScreenLockPassCodeRequireOnStart', NULL, false, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('licenseKey', NULL, NULL, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('screenLockPassCodeLength', NULL, NULL, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isShowCollectionNameOnNavBar', NULL, true, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isSkipAutoStartPrompt', NULL, false, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('autoMaskWordsList', '', NULL, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('appLastUpdateVersion', '0.0.1', NULL, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isAutoCloseOnCopyPaste', NULL, false, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('userSelectedLanguage', '', NULL, NULL);

INSERT INTO settings (name, value_text, value_bool, value_int)
VALUES ('isSearchNameOrLabelOnly', NULL, true, NULL);
