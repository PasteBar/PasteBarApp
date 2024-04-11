use crate::services::request_service::{self, Content, ContentScraping, HttpRequest, HttpScraping};

#[tauri::command(async)]
pub async fn run_web_request(request: HttpRequest) -> Result<Content, String> {
  request_service::run_web_request(request).await
}

#[tauri::command(async)]
pub async fn run_web_scraping(request: HttpScraping) -> Result<ContentScraping, String> {
  request_service::run_web_scraping(request).await
}
