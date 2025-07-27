#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use std::fs;
use std::path::Path;
use tauri::{Emitter, Manager};
use tokio::time::{sleep, Duration};
use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};

struct AppState {
    cancel_flag: Arc<AtomicBool>,
}

#[tauri::command]
async fn organize_files(
    path: String,
    window: tauri::Window,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.cancel_flag.store(false, Ordering::Relaxed);

    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    let files: Vec<_> = entries.filter_map(Result::ok).collect();
    let total = files.len();

    if total == 0 {
        return Err("No files found in the selected folder".into());
    }

    let mut processed = 0;
    for entry in files {
        if state.cancel_flag.load(Ordering::Relaxed) {
            println!("Organizing stopped by user.");
            break;
        }

        let file_name = entry.file_name();
        let file_path = entry.path();

        if file_path.is_file() {
            if let Some(ext) = file_path.extension() {
                let folder_name = ext.to_string_lossy().to_string();
                let dest_folder = Path::new(&path).join(&folder_name);
                fs::create_dir_all(&dest_folder).map_err(|e| e.to_string())?;

                let dest_path = dest_folder.join(file_name);
                fs::rename(&file_path, &dest_path).map_err(|e| e.to_string())?;
            }
        }

        processed += 1;
        let progress = (processed as f64 / total as f64) * 100.0;
        if let Err(e) = window.emit("progress", progress as i32) {
            eprintln!("Failed to emit progress: {}", e);
        }

        sleep(Duration::from_millis(150)).await;
    }

    Ok(())
}

#[tauri::command]
fn cancel_organize(state: tauri::State<AppState>) {
    state.cancel_flag.store(true, Ordering::Relaxed);
    println!("Cancel requested...");
}

#[tauri::command]
async fn undo_organization(
    path: String,
    window: tauri::Window,
    _state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    let folders: Vec<_> = entries.filter_map(Result::ok).collect();
    let total = folders.len();
    let mut processed = 0;

    for folder in folders {
        if folder.path().is_dir() {
            let sub_files = fs::read_dir(folder.path()).map_err(|e| e.to_string())?;
            for sub_file in sub_files {
                let sub_file = sub_file.map_err(|e| e.to_string())?;
                let dest_path = Path::new(&path).join(sub_file.file_name());
                fs::rename(sub_file.path(), dest_path).map_err(|e| e.to_string())?;
            }
            fs::remove_dir(folder.path()).map_err(|e| e.to_string())?;
        }

        processed += 1;
        let progress = (processed as f64 / total as f64) * 100.0;
        if let Err(e) = window.emit("progress", progress as i32) {
            eprintln!("Failed to emit progress: {}", e);
        }

        sleep(Duration::from_millis(150)).await;
    }

    Ok(())
}

#[tokio::main]
async fn main() {
    // ✅ Initialize Discord RPC
    tokio::spawn(async move {
        let mut client = DiscordIpcClient::new("1398850195109839081").unwrap();

        if let Err(e) = client.connect() {
            eprintln!("Failed to connect to Discord: {}", e);
            return;
        }

        if let Err(e) = client.set_activity(
            activity::Activity::new()
                .state("by deepsomnia_")
                .details("Neatify - Organizing Files")
                .assets(
                    activity::Assets::new()
                        .large_image("neatify_logo") // You must upload this in Discord Developer Portal
                        .large_text("Neatify App"),
                )
               
        ) {
            eprintln!("Failed to set Discord activity: {}", e);
        }

        loop {
            sleep(Duration::from_secs(15)).await;
        }
    });

    tauri::Builder::default()
        .manage(AppState {
            cancel_flag: Arc::new(AtomicBool::new(false)),
        })
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            organize_files,
            cancel_organize,
            undo_organization
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                window.show().unwrap();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
