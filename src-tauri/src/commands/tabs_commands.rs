use crate::models::models::{Tabs, UpdatedTabData};
use crate::services::tabs_service::{
  create_new_tab, delete_tab_by_tab_id, update_tab_by_id, CreateTab,
};
use nanoid::nanoid;

#[tauri::command]
pub fn create_tab(tab: CreateTab) -> Result<String, String> {
  let new_tab = Tabs {
    tab_id: nanoid!().to_string(),
    collection_id: tab.collection_id,
    tab_name: tab.tab_name,
    tab_is_active: true,
    tab_is_hidden: false,
    tab_order_number: tab.tab_order_number,
    tab_color: tab.tab_color,
    tab_layout: None,
    tab_layout_split: 2,
    tab_is_protected: false,
  };

  match create_new_tab(&new_tab) {
    Ok(_) => Ok(new_tab.tab_id),
    Err(e) => Err(format!("Failed to create tab: {}", e)),
  }
}

#[tauri::command]
pub fn update_tabs(updated_tabs: Vec<UpdatedTabData>) -> String {
  println!("Processing update tabs request");

  let mut errors = Vec::new();

  for updated_tab in &updated_tabs {
    if updated_tab.tab_id.is_none() {
      errors.push("Tab ID is required".to_string());
      continue;
    }

    let tab_id_value = updated_tab.tab_id.clone().unwrap();

    let updated_data = UpdatedTabData {
      tab_id: None,
      tab_name: updated_tab.tab_name.clone(),
      tab_order_number: updated_tab.tab_order_number,
      collection_id: updated_tab.collection_id.clone(),
      tab_is_active: updated_tab.tab_is_active,
      tab_is_hidden: updated_tab.tab_is_hidden,
      tab_color: updated_tab.tab_color.clone(),
      tab_layout: updated_tab.tab_layout.clone(),
      tab_layout_split: updated_tab.tab_layout_split.clone(),
      tab_is_protected: updated_tab.tab_is_protected,
    };

    update_tab_by_id(tab_id_value, updated_data);
  }

  if errors.is_empty() {
    "ok".to_string()
  } else {
    format!("Errors occurred during tab updates: {:?}", errors)
  }
}

#[tauri::command]
pub fn update_tab(updated_tab: UpdatedTabData) -> String {
  if updated_tab.tab_id.is_none() {
    return "Tab ID is required".to_string();
  }

  let tab_id_value = updated_tab.tab_id.unwrap();

  let updated_data = UpdatedTabData {
    tab_id: None,
    tab_name: updated_tab.tab_name,
    tab_order_number: updated_tab.tab_order_number,
    collection_id: updated_tab.collection_id,
    tab_is_active: updated_tab.tab_is_active,
    tab_is_hidden: updated_tab.tab_is_hidden,
    tab_color: updated_tab.tab_color,
    tab_layout: updated_tab.tab_layout,
    tab_layout_split: updated_tab.tab_layout_split,
    tab_is_protected: updated_tab.tab_is_protected,
  };

  update_tab_by_id(tab_id_value, updated_data)
}

#[tauri::command]
pub fn delete_tab(tab_id: String) -> String {
  delete_tab_by_tab_id(&tab_id)
}
