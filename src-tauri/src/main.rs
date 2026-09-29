#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod categories;
mod engine;
mod native;
use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use std::sync::Mutex;

struct Presence(Mutex<Option<DiscordIpcClient>>);
#[tauri::command]
fn set_discord_presence(enabled: bool, state: tauri::State<Presence>) -> Result<(), String> {
    let mut presence = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(client) = presence.as_mut() {
        let _ = client.clear_activity();
        let _ = client.close();
    }
    *presence = None;
    if enabled {
        let mut client = DiscordIpcClient::new("1554260146321100911").map_err(|e| e.to_string())?;
        client
            .connect()
            .map_err(|e| {
                format!(
                    "Could not connect to Discord: {}. Open the Discord desktop app and enable Activity Status.",
                    e
                )
            })?;
        client
            .set_activity(
                activity::Activity::new()
                    .details("Making room for good things")
                    .state("Ready to tidy files"),
            )
            .map_err(|e| format!("Discord did not accept the activity: {}", e))?;
        *presence = Some(client);
    }
    Ok(())
}
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .manage(native::NativeState::default())
        .manage(engine::Engine::default())
        .manage(Presence(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            engine::organize_files,
            engine::get_organization_plan,
            engine::cancel_organize,
            engine::undo_organization,
            engine::fetch_stats,
            engine::clear_activity,
            engine::export_activity,
            engine::resolve_drop,
            native::set_tray_preference,
            set_discord_presence
        ])
        .setup(native::setup)
        .on_window_event(native::window_event)
        .run(tauri::generate_context!())
        .expect("error while running Neatify");
}
