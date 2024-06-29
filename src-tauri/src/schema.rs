// @generated automatically by Diesel CLI.

diesel::table! {
    clipboard_history (history_id) {
        history_id -> Text,
        title -> Nullable<Text>,
        value -> Nullable<Text>,
        value_preview -> Nullable<Text>,
        value_more_preview_lines -> Nullable<Integer>,
        value_more_preview_chars -> Nullable<Integer>,
        value_hash -> Nullable<Text>,
        is_image -> Nullable<Bool>,
        image_path_full_res -> Nullable<Text>,
        image_data_low_res -> Nullable<Binary>,
        image_preview_height -> Nullable<Integer>,
        image_height -> Nullable<Integer>,
        image_width -> Nullable<Integer>,
        image_data_url -> Nullable<Text>,
        image_hash -> Nullable<Text>,
        is_image_data -> Nullable<Bool>,
        is_masked -> Nullable<Bool>,
        is_text -> Nullable<Bool>,
        is_code -> Nullable<Bool>,
        is_link -> Nullable<Bool>,
        is_video -> Nullable<Bool>,
        has_emoji -> Nullable<Bool>,
        has_masked_words -> Nullable<Bool>,
        is_pinned -> Nullable<Bool>,
        is_favorite -> Nullable<Bool>,
        links -> Nullable<Text>,
        detected_language -> Nullable<Text>,
        pinned_order_number -> Nullable<Integer>,
        created_at -> BigInt,
        updated_at -> BigInt,
        created_date -> Timestamp,
        updated_date -> Timestamp,
        history_options -> Nullable<Text>,
    }
}

diesel::table! {
    collection_clips (collection_id, item_id, tab_id) {
        collection_id -> Text,
        item_id -> Text,
        tab_id -> Text,
        parent_id -> Nullable<Text>,
        order_number -> Integer,
    }
}

diesel::table! {
    collection_menu (collection_id, item_id) {
        collection_id -> Text,
        item_id -> Text,
        parent_id -> Nullable<Text>,
        order_number -> Integer,
    }
}

diesel::table! {
    collections (collection_id) {
        collection_id -> Text,
        title -> Text,
        description -> Nullable<Text>,
        is_default -> Bool,
        is_enabled -> Bool,
        is_selected -> Bool,
        created_at -> BigInt,
        updated_at -> BigInt,
        created_date -> Timestamp,
        updated_date -> Timestamp,
    }
}

diesel::table! {
    items (item_id) {
        item_id -> Text,
        name -> Text,
        description -> Nullable<Text>,
        value -> Nullable<Text>,
        color -> Nullable<Text>,
        border_width -> Nullable<Integer>,
        is_image -> Nullable<Bool>,
        image_path_full_res -> Nullable<Text>,
        image_preview_height -> Nullable<Integer>,
        image_height -> Nullable<Integer>,
        image_width -> Nullable<Integer>,
        image_data_url -> Nullable<Text>,
        image_type -> Nullable<Text>,
        image_hash -> Nullable<Text>,
        image_scale -> Nullable<Integer>,
        is_image_data -> Nullable<Bool>,
        is_masked -> Nullable<Bool>,
        is_text -> Nullable<Bool>,
        is_form -> Nullable<Bool>,
        is_template -> Nullable<Bool>,
        is_code -> Nullable<Bool>,
        is_link -> Nullable<Bool>,
        is_path -> Nullable<Bool>,
        is_file -> Nullable<Bool>,
        is_pinned -> Nullable<Bool>,
        is_favorite -> Nullable<Bool>,
        is_protected -> Nullable<Bool>,
        is_command -> Nullable<Bool>,
        is_web_request -> Nullable<Bool>,
        is_web_scraping -> Nullable<Bool>,
        is_video -> Nullable<Bool>,
        has_emoji -> Nullable<Bool>,
        has_masked_words -> Nullable<Bool>,
        path_type -> Nullable<Text>,
        icon -> Nullable<Text>,
        icon_visibility -> Nullable<Text>,
        command_request_output -> Nullable<Text>,
        command_request_last_run_at -> Nullable<BigInt>,
        request_options -> Nullable<Text>,
        form_template_options -> Nullable<Text>,
        links -> Nullable<Text>,
        detected_language -> Nullable<Text>,
        is_active -> Bool,
        is_disabled -> Bool,
        is_deleted -> Bool,
        is_folder -> Bool,
        is_separator -> Bool,
        is_board -> Bool,
        is_menu -> Bool,
        is_clip -> Bool,
        size -> Nullable<Text>,
        layout -> Nullable<Text>,
        layout_items_max_width -> Nullable<Text>,
        layout_split -> Integer,
        show_description -> Nullable<Bool>,
        pinned_order_number -> Nullable<Integer>,
        created_at -> BigInt,
        updated_at -> BigInt,
        created_date -> Timestamp,
        updated_date -> Timestamp,
        item_options -> Nullable<Text>,
    }
}

diesel::table! {
    link_metadata (metadata_id) {
        metadata_id -> Text,
        history_id -> Nullable<Text>,
        item_id -> Nullable<Text>,
        link_url -> Nullable<Text>,
        link_title -> Nullable<Text>,
        link_description -> Nullable<Text>,
        link_image -> Nullable<Text>,
        link_domain -> Nullable<Text>,
        link_favicon -> Nullable<Text>,
        link_track_artist -> Nullable<Text>,
        link_track_title -> Nullable<Text>,
        link_track_album -> Nullable<Text>,
        link_track_year -> Nullable<Text>,
        link_is_track -> Nullable<Bool>,
    }
}

diesel::table! {
    settings (name) {
        name -> Text,
        value_text -> Nullable<Text>,
        value_bool -> Nullable<Bool>,
        value_int -> Nullable<Integer>,
    }
}

diesel::table! {
    tabs (tab_id) {
        tab_id -> Text,
        collection_id -> Text,
        tab_name -> Text,
        tab_is_active -> Bool,
        tab_is_hidden -> Bool,
        tab_order_number -> Integer,
        tab_color -> Nullable<Text>,
        tab_layout -> Nullable<Text>,
        tab_layout_split -> Integer,
        tab_is_protected -> Bool,
    }
}

diesel::joinable!(collection_clips -> collections (collection_id));
diesel::joinable!(collection_clips -> tabs (tab_id));
diesel::joinable!(collection_menu -> collections (collection_id));
diesel::joinable!(link_metadata -> clipboard_history (history_id));
diesel::joinable!(link_metadata -> items (item_id));
diesel::joinable!(tabs -> collections (collection_id));

diesel::allow_tables_to_appear_in_same_query!(
    clipboard_history,
    collection_clips,
    collection_menu,
    collections,
    items,
    link_metadata,
    settings,
    tabs,
);
